import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
    UserProfileDto,
    PublicUserDto,
    UserListItemDto,
    PaginatedUsersDto,
} from './dto/user-response.dto';

// Cache keys
const CACHE_KEY_PUBLIC_PROFILE = 'users:public';
const CACHE_TTL_PUBLIC_PROFILE = 600000; // 10 minutes

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    // ============ Current User Profile ============

    /**
     * Get current user's full profile
     */
    async getProfile(userId: number): Promise<UserProfileDto> {
        this.logger.log(`Getting profile for user: ${userId}`);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.mapToProfile(user);
    }

    /**
     * Update current user's profile
     */
    async updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserProfileDto> {
        this.logger.log(`Updating profile for user: ${userId}`);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                name: dto.name,
                bio: dto.bio,
                photoURL: dto.photoURL,
            },
        });

        // Invalidate public profile cache
        await this.cacheManager.del(`${CACHE_KEY_PUBLIC_PROFILE}:${userId}`);
        this.logger.log(`Public profile cache invalidated for user: ${userId}`);

        return this.mapToProfile(updated);
    }

    // ============ Public Profile ============

    /**
     * Get public profile of a user (for viewing instructors, etc.)
     */
    async getPublicProfile(userId: number): Promise<PublicUserDto> {
        const cacheKey = `${CACHE_KEY_PUBLIC_PROFILE}:${userId}`;

        // Check cache first
        const cached = await this.cacheManager.get<PublicUserDto>(cacheKey);
        if (cached) {
            this.logger.log(`Getting public profile for user: ${userId} (from cache)`);
            return cached;
        }

        this.logger.log(`Getting public profile for user: ${userId} (from database)`);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                photoURL: true,
                bio: true,
                role: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const result: PublicUserDto = {
            id: user.id,
            name: user.name ?? undefined,
            photoURL: user.photoURL ?? undefined,
            bio: user.bio ?? undefined,
            role: user.role,
        };

        // Store in cache
        await this.cacheManager.set(cacheKey, result, CACHE_TTL_PUBLIC_PROFILE);

        return result;
    }

    // ============ Admin: List Users ============

    /**
     * Get paginated list of all users (admin only)
     */
    async listUsers(page: number = 1, limit: number = 20): Promise<PaginatedUsersDto> {
        this.logger.log(`Admin: Listing users (page: ${page}, limit: ${limit})`);
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    emailVerified: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count(),
        ]);

        return {
            users: users.map((user) => ({
                id: user.id,
                email: user.email,
                name: user.name ?? undefined,
                role: user.role,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ============ Helper: Find by Firebase UID ============

    /**
     * Find user by Firebase UID (used by auth guard)
     */
    async findByFirebaseUid(firebaseUid: string) {
        return this.prisma.user.findUnique({ where: { firebaseUid } });
    }

    /**
     * Find user by ID
     */
    async findById(id: number) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    // ============ Mappers ============

    private mapToProfile(user: any): UserProfileDto {
        return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            photoURL: user.photoURL ?? undefined,
            bio: user.bio ?? undefined,
            role: user.role,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
