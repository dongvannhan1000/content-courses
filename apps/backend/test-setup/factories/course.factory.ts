import { faker } from '@faker-js/faker';
import { Course, CourseStatus } from '@prisma/client';
import { BaseFactory } from './base.factory';
import { Prisma } from '@prisma/client';

/**
 * Course data interface for factory creation
 */
type CourseCreateData = Omit<Prisma.CourseCreateInput, 'category' | 'instructor' | 'lessons' | 'enrollments' | 'reviews' | 'media'>;

/**
 * Course factory for creating test courses
 * Supports different course statuses, pricing, and configurations
 */
export class CourseFactory extends BaseFactory<Course> {
  create(overrides?: Partial<CourseCreateData>): CourseCreateData {
    const title = faker.helpers.arrayElement([
      'Complete Web Development Bootcamp',
      'Advanced JavaScript Masterclass',
      'React.js From Scratch',
      'Node.js Backend Development',
      'Python for Data Science',
      'Machine Learning Fundamentals',
      'UI/UX Design Principles',
      'Mobile App Development',
    ]);

    return {
      title,
      slug: this.generateSlug(title),
      description: faker.lorem.paragraphs(4),
      shortDesc: faker.lorem.sentences(2),
      price: faker.number.int({ min: 99000, max: 2999000 }), // 99K - 2,999K VND
      discountPrice: this.randomBoolean(0.3) ? faker.number.int({ min: 49000, max: 1999000 }) : null,
      status: CourseStatus.DRAFT,
      level: faker.helpers.arrayElement(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
      duration: faker.number.int({ min: 1, max: 100 }), // hours
      categoryId: undefined, // Will be set when creating
      instructorId: undefined, // Will be set when creating
      ...overrides,
    } as any;
  }

  getModelName(): string {
    return 'course';
  }

  /**
   * Create draft course
   */
  static createDraft(overrides?: Partial<CourseCreateData>): CourseCreateData {
    return new CourseFactory().create({
      status: CourseStatus.DRAFT,
      ...overrides,
    });
  }

  /**
   * Create published course
   */
  static createPublished(overrides?: Partial<CourseCreateData>): CourseCreateData {
    return new CourseFactory().create({
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      ...overrides,
    });
  }

  /**
   * Create pending course (awaiting approval)
   */
  static createPending(overrides?: Partial<CourseCreateData>): CourseCreateData {
    return new CourseFactory().create({
      status: CourseStatus.PENDING,
      ...overrides,
    });
  }

  /**
   * Create archived course
   */
  static createArchived(overrides?: Partial<CourseCreateData>): CourseCreateData {
    return new CourseFactory().create({
      status: CourseStatus.ARCHIVED,
      ...overrides,
    });
  }

  /**
   * Create free course
   */
  static createFree(overrides?: Partial<CourseCreateData>): CourseCreateData {
    return new CourseFactory().create({
      price: 0,
      discountPrice: null,
      ...overrides,
    });
  }

  /**
   * Create paid course
   */
  static createPaid(overrides?: Partial<CourseCreateData>): CourseCreateData {
    return new CourseFactory().create({
      price: faker.number.int({ min: 199000, max: 2999000 }),
      ...overrides,
    });
  }

  /**
   * Create course with discount
   */
  static createWithDiscount(
    originalPrice: number,
    discountPercentage: number = 20,
    overrides?: Partial<CourseCreateData>
  ): CourseCreateData {
    const discountPrice = originalPrice * (1 - discountPercentage / 100);

    return new CourseFactory().create({
      price: originalPrice,
      discountPrice,
      ...overrides,
    });
  }

  /**
   * Create beginner course
   */
  static createBeginnerCourse(overrides?: Partial<CourseCreateData>): CourseCreateData {
    return new CourseFactory().create({
      level: 'BEGINNER',
      title: faker.helpers.arrayElement([
        'Introduction to Programming',
        'Web Development Basics',
        'JavaScript for Beginners',
        'Python Fundamentals',
      ]),
      duration: faker.number.int({ min: 5, max: 20 }),
      ...overrides,
    });
  }

  /**
   * Create intermediate course
   */
  static createIntermediateCourse(overrides?: Partial<CourseCreateData>): CourseCreateData {
    return new CourseFactory().create({
      level: 'INTERMEDIATE',
      title: faker.helpers.arrayElement([
        'Advanced JavaScript Concepts',
        'React.js Advanced Patterns',
        'Node.js Backend Architecture',
        'Database Design Patterns',
      ]),
      duration: faker.number.int({ min: 15, max: 50 }),
      ...overrides,
    });
  }

  /**
   * Create advanced course
   */
  static createAdvancedCourse(overrides?: Partial<CourseCreateData>): CourseCreateData {
    return new CourseFactory().create({
      level: 'ADVANCED',
      title: faker.helpers.arrayElement([
        'Machine Learning Engineering',
        'System Design Masterclass',
        'Advanced DevOps Practices',
        'Cloud Architecture Patterns',
      ]),
      duration: faker.number.int({ min: 40, max: 100 }),
      price: faker.number.int({ min: 990000, max: 2999000 }),
      ...overrides,
    });
  }

  /**
   * Create course with thumbnail
   */
  static createWithThumbnail(thumbnailUrl: string, overrides?: Partial<CourseCreateData>): CourseCreateData {
    return new CourseFactory().create({
      thumbnail: thumbnailUrl,
      ...overrides,
    });
  }

  /**
   * Create course for specific category
   */
  static async createForCategory(
    categoryId: number,
    instructorId: number,
    overrides?: Partial<CourseCreateData>
  ): Promise<Course> {
    const factory = new CourseFactory();

    return await factory.createAndSave({
      categoryId,
      instructorId,
      ...overrides,
    } as any);
  }

  /**
   * Create course for specific instructor
   */
  static async createForInstructor(
    instructorId: number,
    count: number = 1,
    overrides?: Partial<CourseCreateData>
  ): Promise<Course[]> {
    const factory = new CourseFactory();
    const courses: Course[] = [];

    for (let i = 0; i < count; i++) {
      const course = await factory.createAndSave({
        instructorId,
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
        ...overrides,
      } as any);
      courses.push(course);
    }

    return courses;
  }

  /**
   * Create course with lessons (requires LessonFactory)
   */
  async createWithLessons(
    lessonCount: number = 5,
    overrides?: Partial<CourseCreateData>
  ): Promise<{ course: Course; lessons: any[] }> {
    const course = await this.createAndSave({
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      ...overrides,
    } as any);

    // Note: This would require LessonFactory to be available
    // For now, return the course without lessons
    // In a full implementation, we would create lessons here

    return {
      course,
      lessons: [], // TODO: Implement when LessonFactory is available
    };
  }

  /**
   * Find courses by status
   */
  async findByStatus(status: CourseStatus): Promise<Course[]> {
    return await this.prisma.course.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find published courses
   */
  async findPublished(): Promise<Course[]> {
    return await this.findByStatus(CourseStatus.PUBLISHED);
  }

  /**
   * Find courses by instructor
   */
  async findByInstructor(instructorId: number): Promise<Course[]> {
    return await this.prisma.course.findMany({
      where: { instructorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find courses by category
   */
  async findByCategory(categoryId: number): Promise<Course[]> {
    return await this.prisma.course.findMany({
      where: { categoryId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find courses by level
   */
  async findByLevel(level: string): Promise<Course[]> {
    return await this.prisma.course.findMany({
      where: { level },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find free courses
   */
  async findFreeCourses(): Promise<Course[]> {
    return await this.prisma.course.findMany({
      where: { price: 0 },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find paid courses
   */
  async findPaidCourses(): Promise<Course[]> {
    return await this.prisma.course.findMany({
      where: { price: { gt: 0 } },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Search courses by title or description
   */
  async search(query: string): Promise<Course[]> {
    return await this.prisma.course.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { shortDesc: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { title: 'asc' },
    });
  }

  /**
   * Find courses with price range
   */
  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Course[]> {
    return await this.prisma.course.findMany({
      where: {
        AND: [
          { price: { gte: minPrice } },
          { price: { lte: maxPrice } },
        ],
      },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Create course enrollment statistics test data
   */
  async createWithEnrollmentStats(
    targetEnrollments: number = 50,
    overrides?: Partial<CourseCreateData>
  ): Promise<Course> {
    const course = await this.createAndSave({
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - faker.number.int({ min: 30, max: 365 }) * 24 * 60 * 60 * 1000),
      ...overrides,
    } as any);

    // Note: Actual enrollment creation would require EnrollmentFactory
    // This is just a placeholder for the structure

    return course;
  }

  /**
   * Create course with reviews (requires ReviewFactory)
   */
  async createWithReviews(
    reviewCount: number = 5,
    overrides?: Partial<CourseCreateData>
  ): Promise<{ course: Course; reviews: any[] }> {
    const course = await this.createAndSave({
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      ...overrides,
    } as any);

    // Note: This would require ReviewFactory to be available
    // For now, return the course without reviews

    return {
      course,
      reviews: [], // TODO: Implement when ReviewFactory is available
    };
  }
}