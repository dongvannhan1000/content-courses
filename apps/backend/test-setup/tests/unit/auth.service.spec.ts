import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { PrismaService } from '../../../src/infra/prisma/prisma.service';
import { FirebaseService } from '../../../src/infra/firebase/firebase.service';
import { Role } from '@prisma/client';

describe('AuthService', () => {
    let service: AuthService;
    let prismaService: jest.Mocked<PrismaService>;
    let firebaseService: jest.Mocked<FirebaseService>;
    let configService: jest.Mocked<ConfigService>;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            upsert: jest.fn(),
        },
    };

    const mockFirebaseService = {
        createUser: jest.fn(),
        verifyIdToken: jest.fn(),
        getUserByUid: jest.fn(),
        generatePasswordResetLink: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    const mockUser = {
        id: 1,
        firebaseUid: 'firebase-uid-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        photoURL: null,
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockFirebaseUser = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
        photoURL: null,
    };

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup default config return
        mockConfigService.get.mockImplementation((key: string) => {
            if (key === 'ADMIN_EMAIL') return 'admin@test.com';
            return null;
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: FirebaseService,
                    useValue: mockFirebaseService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prismaService = module.get(PrismaService);
        firebaseService = module.get(FirebaseService);
        configService = module.get(ConfigService);
    });

    describe('register', () => {
        const registerDto = {
            email: 'newuser@example.com',
            password: 'Password123!',
            name: 'New User',
        };

        it('should register a new user successfully', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockFirebaseService.createUser.mockResolvedValue(mockFirebaseUser);
            mockPrismaService.user.create.mockResolvedValue(mockUser);

            const result = await service.register(registerDto);

            expect(result.message).toBe('User registered successfully');
            expect(mockFirebaseService.createUser).toHaveBeenCalledWith({
                email: registerDto.email,
                password: registerDto.password,
                displayName: registerDto.name,
            });
        });

        it('should throw ConflictException if email already exists in database', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            await expect(service.register(registerDto)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should throw ConflictException if email already exists in Firebase', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockFirebaseService.createUser.mockRejectedValue({
                code: 'auth/email-already-exists',
            });

            await expect(service.register(registerDto)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should throw BadRequestException for invalid email', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockFirebaseService.createUser.mockRejectedValue({
                code: 'auth/invalid-email',
            });

            await expect(service.register(registerDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw BadRequestException for weak password', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockFirebaseService.createUser.mockRejectedValue({
                code: 'auth/weak-password',
            });

            await expect(service.register(registerDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should assign ADMIN role when email matches ADMIN_EMAIL', async () => {
            const adminRegisterDto = {
                ...registerDto,
                email: 'admin@test.com',
            };
            const adminFirebaseUser = {
                ...mockFirebaseUser,
                email: 'admin@test.com',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockFirebaseService.createUser.mockResolvedValue(adminFirebaseUser);
            mockPrismaService.user.create.mockResolvedValue({
                ...mockUser,
                role: Role.ADMIN,
            });

            await service.register(adminRegisterDto);

            expect(mockPrismaService.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    role: Role.ADMIN,
                }),
            });
        });
    });

    describe('login', () => {
        const validToken = 'valid-firebase-token';
        const decodedToken = { uid: 'firebase-uid-123' };

        it('should login existing user successfully', async () => {
            mockFirebaseService.verifyIdToken.mockResolvedValue(decodedToken);
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.login(validToken);

            expect(result.user.email).toBe('test@example.com');
            expect(result.user.role).toBe(Role.USER);
        });

        it('should sync new user from Firebase on first login', async () => {
            mockFirebaseService.verifyIdToken.mockResolvedValue(decodedToken);
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockFirebaseService.getUserByUid.mockResolvedValue(mockFirebaseUser);
            mockPrismaService.user.upsert.mockResolvedValue(mockUser);

            const result = await service.login(validToken);

            expect(mockFirebaseService.getUserByUid).toHaveBeenCalledWith(
                'firebase-uid-123',
            );
            expect(result.user).toBeDefined();
        });

        it('should throw UnauthorizedException for expired token', async () => {
            mockFirebaseService.verifyIdToken.mockRejectedValue({
                code: 'auth/id-token-expired',
            });

            await expect(service.login(validToken)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException for invalid token format', async () => {
            mockFirebaseService.verifyIdToken.mockRejectedValue({
                code: 'auth/argument-error',
            });

            await expect(service.login('invalid-token')).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });

    describe('syncFirebaseUser', () => {
        it('should sync Firebase user to database', async () => {
            mockFirebaseService.getUserByUid.mockResolvedValue(mockFirebaseUser);
            mockPrismaService.user.upsert.mockResolvedValue(mockUser);

            const result = await service.syncFirebaseUser('firebase-uid-123');

            expect(result.email).toBe('test@example.com');
            expect(mockPrismaService.user.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { firebaseUid: 'firebase-uid-123' },
                }),
            );
        });

        it('should assign ADMIN role for admin email', async () => {
            const adminFirebaseUser = {
                ...mockFirebaseUser,
                email: 'admin@test.com',
            };
            mockFirebaseService.getUserByUid.mockResolvedValue(adminFirebaseUser);
            mockPrismaService.user.upsert.mockResolvedValue({
                ...mockUser,
                role: Role.ADMIN,
            });

            await service.syncFirebaseUser('admin-uid');

            expect(mockPrismaService.user.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        role: Role.ADMIN,
                    }),
                }),
            );
        });
    });

    describe('updateUserRole', () => {
        it('should update user role successfully', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.user.update.mockResolvedValue({
                ...mockUser,
                role: Role.INSTRUCTOR,
            });

            const result = await service.updateUserRole(1, Role.INSTRUCTOR, 999);

            expect(result.role).toBe(Role.INSTRUCTOR);
        });

        it('should throw ForbiddenException when changing own role', async () => {
            await expect(
                service.updateUserRole(1, Role.ADMIN, 1),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(
                service.updateUserRole(999, Role.INSTRUCTOR, 1),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('requestPasswordReset', () => {
        it('should request password reset successfully', async () => {
            mockFirebaseService.generatePasswordResetLink.mockResolvedValue(
                'https://reset-link',
            );

            const result = await service.requestPasswordReset('test@example.com');

            expect(result.message).toContain('password reset link');
        });

        it('should return same message even if user does not exist (security)', async () => {
            mockFirebaseService.generatePasswordResetLink.mockRejectedValue(
                new Error('User not found'),
            );

            const result = await service.requestPasswordReset('nonexistent@example.com');

            expect(result.message).toContain('password reset link');
        });
    });

    describe('getUserByFirebaseUid', () => {
        it('should return user by Firebase UID', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.getUserByFirebaseUid('firebase-uid-123');

            expect(result?.email).toBe('test@example.com');
        });

        it('should return null when user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            const result = await service.getUserByFirebaseUid('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('getUserById', () => {
        it('should return user by database ID', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.getUserById(1);

            expect(result?.id).toBe(1);
        });

        it('should return null when user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            const result = await service.getUserById(999);

            expect(result).toBeNull();
        });
    });

    describe('getAllUsers', () => {
        it('should return all users', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

            const result = await service.getAllUsers();

            expect(result).toHaveLength(1);
            expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { createdAt: 'desc' },
                }),
            );
        });
    });
});
