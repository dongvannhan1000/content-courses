import { faker } from '@faker-js/faker';
import { Role, User } from '@prisma/client';
import { BaseFactory } from './base.factory';
import { Prisma } from '@prisma/client';

/**
 * User factory for creating test users
 * Supports different user roles and custom configurations
 */
export class UserFactory extends BaseFactory<User> {
  create(overrides?: Partial<Prisma.UserCreateInput>): Prisma.UserCreateInput {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();

    return {
      firebaseUid: faker.datatype.uuid(),
      email: this.randomEmail(firstName, lastName),
      name: `${firstName} ${lastName}`,
      emailVerified: this.randomBoolean(0.9), // 90% chance of verified
      photoURL: faker.image.avatar(),
      bio: faker.lorem.sentences(2),
      role: Role.USER,
      ...overrides,
    };
  }

  getModelName(): string {
    return 'user';
  }

  /**
   * Create admin user
   */
  static createAdmin(overrides?: Partial<Prisma.UserCreateInput>): Prisma.UserCreateInput {
    return new UserFactory().create({
      role: Role.ADMIN,
      email: 'admin@test.com',
      emailVerified: true,
      ...overrides,
    });
  }

  /**
   * Create instructor user
   */
  static createInstructor(overrides?: Partial<Prisma.UserCreateInput>): Prisma.UserCreateInput {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();

    return new UserFactory().create({
      role: Role.INSTRUCTOR,
      email: `instructor.${firstName.toLowerCase()}@test.com`,
      emailVerified: true,
      name: `${firstName} ${lastName} (Instructor)`,
      bio: faker.lorem.paragraphs(2), // Instructors usually have detailed bios
      ...overrides,
    });
  }

  /**
   * Create student user
   */
  static createStudent(overrides?: Partial<Prisma.UserCreateInput>): Prisma.UserCreateInput {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();

    return new UserFactory().create({
      role: Role.USER,
      email: `student.${firstName.toLowerCase()}@test.com`,
      name: `${firstName} ${lastName}`,
      bio: faker.lorem.sentences(1), // Students might have shorter bios
      ...overrides,
    });
  }

  /**
   * Create user with specific Firebase UID
   */
  static createWithFirebaseUid(
    firebaseUid: string,
    overrides?: Partial<Prisma.UserCreateInput>
  ): Prisma.UserCreateInput {
    return new UserFactory().create({
      firebaseUid,
      emailVerified: true,
      ...overrides,
    });
  }

  /**
   * Create unverified user
   */
  static createUnverified(overrides?: Partial<Prisma.UserCreateInput>): Prisma.UserCreateInput {
    return new UserFactory().create({
      emailVerified: false,
      ...overrides,
    });
  }

  /**
   * Create user with profile photo
   */
  static createWithProfilePhoto(overrides?: Partial<Prisma.UserCreateInput>): Prisma.UserCreateInput {
    return new UserFactory().create({
      photoURL: faker.image.avatar(),
      ...overrides,
    });
  }

  /**
   * Create user without profile photo
   */
  static createWithoutProfilePhoto(overrides?: Partial<Prisma.UserCreateInput>): Prisma.UserCreateInput {
    return new UserFactory().create({
      photoURL: null,
      ...overrides,
    });
  }

  /**
   * Create multiple users with different roles
   */
  static async createMixedRoles(count: number = 10): Promise<User[]> {
    const factory = new UserFactory();
    const users: User[] = [];

    const roles = [Role.USER, Role.INSTRUCTOR, Role.ADMIN];
    const roleDistribution = [
      Role.USER, // 70% students
      Role.INSTRUCTOR, // 25% instructors
      Role.ADMIN, // 5% admins
    ];

    for (let i = 0; i < count; i++) {
      const randomRole = roleDistribution[
        Math.floor(Math.random() * roleDistribution.length)
      ];

      let user;
      switch (randomRole) {
        case Role.ADMIN:
          user = await factory.createAndSave({
            role: Role.ADMIN,
            email: `admin${i + 1}@test.com`,
          });
          break;
        case Role.INSTRUCTOR:
          user = await factory.createAndSave({
            role: Role.INSTRUCTOR,
            email: `instructor${i + 1}@test.com`,
          });
          break;
        default:
          user = await factory.createAndSave({
            role: Role.USER,
            email: `student${i + 1}@test.com`,
          });
          break;
      }

      users.push(user);
    }

    return users;
  }

  /**
   * Create user for testing authentication flows
   */
  static createForAuthTest(): {
    user: Prisma.UserCreateInput;
    firebaseUid: string;
    email: string;
    password?: string;
  } {
    const firebaseUid = faker.datatype.uuid();
    const email = faker.internet.email();
    const password = faker.internet.password(12);

    return {
      user: this.createWithFirebaseUid(firebaseUid, { email }),
      firebaseUid,
      email,
      password,
    };
  }

  /**
   * Find user by Firebase UID
   */
  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { firebaseUid },
    });
  }

  /**
   * Find users by role
   */
  async findByRole(role: Role): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Search users by name or email
   */
  async search(query: string): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create user with course enrollment history
   */
  async createWithEnrollments(
    courseCount: number = 3,
    overrides?: Partial<Prisma.UserCreateInput>
  ): Promise<{ user: User; enrollments: any[] }> {
    const user = await this.createAndSave(overrides);

    // This would require CourseFactory to be available
    // For now, return the user without enrollments
    // In a full implementation, we would create courses and enrollments here

    return {
      user,
      enrollments: [], // TODO: Implement when CourseFactory is available
    };
  }
}