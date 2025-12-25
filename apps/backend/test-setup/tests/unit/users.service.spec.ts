import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../src/modules/users/users.service';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import { Role } from '@prisma/client';

describe('UsersService', () => {
    let service: UsersService;
    let prismaService: jest.Mocked<PrismaService>;
    let cacheManager: jest.Mocked<any>;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
    };

    const mockCacheManager = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };

    const mockUser = {
        id: 1,
        firebaseUid: 'firebase-uid-123',
        email: 'test@example.com',
        name: 'Test User',
        bio: 'A test bio',
        photoURL: 'https://example.com/photo.jpg',
        role: Role.USER,
        emailVerified: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prismaService = module.get(PrismaService);
        cacheManager = module.get(CACHE_MANAGER);

        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        it('should return user profile when found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.getProfile(1);

            expect(result.id).toBe(1);
            expect(result.email).toBe('test@example.com');
            expect(result.name).toBe('Test User');
            expect(result.role).toBe(Role.USER);
        });

        it('should throw NotFoundException when user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateProfile', () => {
        const updateDto = {
            name: 'Updated Name',
            bio: 'Updated bio',
        };

        it('should update user profile successfully', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.user.update.mockResolvedValue({
                ...mockUser,
                ...updateDto,
            });

            const result = await service.updateProfile(1, updateDto);

            expect(result.name).toBe('Updated Name');
            expect(result.bio).toBe('Updated bio');
            expect(mockCacheManager.del).toHaveBeenCalledWith('users:public:1');
        });

        it('should throw NotFoundException when user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.updateProfile(999, updateDto)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should invalidate cache after update', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.user.update.mockResolvedValue(mockUser);

            await service.updateProfile(1, updateDto);

            expect(mockCacheManager.del).toHaveBeenCalledWith('users:public:1');
        });
    });

    describe('getPublicProfile', () => {
        const publicUserData = {
            id: 1,
            name: 'Test User',
            photoURL: 'https://example.com/photo.jpg',
            bio: 'A test bio',
            role: Role.USER,
        };

        it('should return cached public profile if available', async () => {
            mockCacheManager.get.mockResolvedValue(publicUserData);

            const result = await service.getPublicProfile(1);

            expect(result).toEqual(publicUserData);
            expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
        });

        it('should fetch from database and cache when not cached', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.user.findUnique.mockResolvedValue(publicUserData);

            const result = await service.getPublicProfile(1);

            expect(result.id).toBe(1);
            expect(result.name).toBe('Test User');
            expect(mockCacheManager.set).toHaveBeenCalled();
        });

        it('should throw NotFoundException when user not found', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.getPublicProfile(999)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('listUsers', () => {
        const mockUsers = [
            { id: 1, email: 'user1@test.com', name: 'User 1', role: Role.USER, emailVerified: true, createdAt: new Date() },
            { id: 2, email: 'user2@test.com', name: 'User 2', role: Role.INSTRUCTOR, emailVerified: true, createdAt: new Date() },
        ];

        it('should return paginated list of users', async () => {
            mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
            mockPrismaService.user.count.mockResolvedValue(25);

            const result = await service.listUsers(1, 20);

            expect(result.users).toHaveLength(2);
            expect(result.total).toBe(25);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
            expect(result.totalPages).toBe(2);
        });

        it('should calculate correct pagination', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([]);
            mockPrismaService.user.count.mockResolvedValue(100);

            const result = await service.listUsers(3, 10);

            expect(result.page).toBe(3);
            expect(result.limit).toBe(10);
            expect(result.totalPages).toBe(10);
        });

        it('should use default values when not provided', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([]);
            mockPrismaService.user.count.mockResolvedValue(0);

            const result = await service.listUsers();

            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
        });
    });

    describe('findByFirebaseUid', () => {
        it('should find user by Firebase UID', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.findByFirebaseUid('firebase-uid-123');

            expect(result).toEqual(mockUser);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { firebaseUid: 'firebase-uid-123' },
            });
        });

        it('should return null when user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            const result = await service.findByFirebaseUid('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should find user by ID', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.findById(1);

            expect(result).toEqual(mockUser);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it('should return null when user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            const result = await service.findById(999);

            expect(result).toBeNull();
        });
    });
});
