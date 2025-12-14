import { faker } from '@faker-js/faker';
import { Category } from '@prisma/client';
import { BaseFactory } from './base.factory';
import { Prisma } from '@prisma/client';

/**
 * Category data interface for factory creation
 */
type CategoryCreateData = Omit<Prisma.CategoryCreateInput, 'parent' | 'children' | 'courses'>;

/**
 * Category factory for creating test categories
 * Supports hierarchical categories and various configurations
 */
export class CategoryFactory extends BaseFactory<Category> {
  create(overrides?: Partial<CategoryCreateData>): CategoryCreateData {
    const name = faker.lorem.words(2);

    return {
      name,
      slug: this.generateSlug(name),
      description: faker.lorem.sentences(2),
      icon: faker.internet.url(),
      order: this.randomInt(0, 100),
      isActive: this.randomBoolean(0.8), // 80% chance of being active
      ...overrides,
    };
  }

  getModelName(): string {
    return 'category';
  }

  /**
   * Generate slug from text
   */
  private static generateSlug(text: string): string {
    return faker.helpers.slugify(text).toLowerCase();
  }

  /**
   * Generate random int for static methods
   */
  private static randomInt(min: number, max: number): number {
    return faker.number.int({ min, max });
  }

  /**
   * Create active category
   */
  static createActive(overrides?: Partial<CategoryCreateData>): CategoryCreateData {
    return new CategoryFactory().create({
      isActive: true,
      ...overrides,
    });
  }

  /**
   * Create inactive category
   */
  static createInactive(overrides?: Partial<CategoryCreateData>): CategoryCreateData {
    return new CategoryFactory().create({
      isActive: false,
      ...overrides,
    });
  }

  /**
   * Create root category (no parent)
   */
  static createRootCategory(overrides?: Partial<CategoryCreateData>): CategoryCreateData {
    const name = faker.helpers.arrayElement([
      'Technology',
      'Business',
      'Design',
      'Marketing',
      'Development',
      'Data Science',
      'Photography',
      'Music',
    ]);

    return new CategoryFactory().create({
      name,
      slug: this.generateSlug(name),
      description: faker.lorem.paragraphs(2),
      parentId: null,
      order: this.randomInt(0, 10),
      isActive: true,
      ...overrides,
    } as any);
  }

  /**
   * Create subcategory
   */
  static async createSubcategory(
    parentId: number,
    overrides?: Partial<CategoryCreateData>
  ): Promise<Category> {
    const factory = new CategoryFactory();
    const parentName = faker.lorem.words(2);
    const subName = `${parentName} - ${faker.lorem.words(1)}`;

    return await factory.createAndSave({
      name: subName,
      slug: factory.generateSlug(subName),
      description: faker.lorem.sentences(2),
      parentId,
      order: this.randomInt(0, 50),
      isActive: true,
      ...overrides,
    } as any);
  }

  /**
   * Create category hierarchy (parent + children)
   */
  static async createHierarchy(
    childCount: number = 3,
    parentOverrides?: Partial<CategoryCreateData>,
    childOverrides?: Partial<CategoryCreateData>
  ): Promise<{ parent: Category; children: Category[] }> {
    const factory = new CategoryFactory();

    // Create parent category
    const parent = await factory.createAndSave({
      name: faker.helpers.arrayElement([
        'Programming',
        'Web Development',
        'Mobile Development',
        'Data Science',
        'Machine Learning',
      ]),
      parentId: null,
      isActive: true,
      ...parentOverrides,
    } as any);

    // Create child categories
    const children: Category[] = [];
    for (let i = 0; i < childCount; i++) {
      const child = await this.createSubcategory(parent.id, childOverrides);
      children.push(child);
    }

    // Update parent order to be first
    await factory.update(parent.id, { order: 0 });

    return { parent, children };
  }

  /**
   * Create category with icon
   */
  static createWithIcon(iconUrl: string, overrides?: Partial<CategoryCreateData>): CategoryCreateData {
    return new CategoryFactory().create({
      icon: iconUrl,
      ...overrides,
    });
  }

  /**
   * Create category without icon
   */
  static createWithoutIcon(overrides?: Partial<CategoryCreateData>): CategoryCreateData {
    return new CategoryFactory().create({
      icon: null,
      ...overrides,
    });
  }

  /**
   * Create predefined categories for common subjects
   */
  static createProgrammingCategory(): CategoryCreateData {
    return new CategoryFactory().create({
      name: 'Programming',
      slug: 'programming',
      description: 'Learn various programming languages and development techniques',
      icon: '💻',
      order: 1,
      isActive: true,
    });
  }

  static createWebDevelopmentCategory(): CategoryCreateData {
    return new CategoryFactory().create({
      name: 'Web Development',
      slug: 'web-development',
      description: 'Build modern web applications with latest technologies',
      icon: '🌐',
      order: 2,
      isActive: true,
    });
  }

  static createMobileDevelopmentCategory(): CategoryCreateData {
    return new CategoryFactory().create({
      name: 'Mobile Development',
      slug: 'mobile-development',
      description: 'Create native and cross-platform mobile applications',
      icon: '📱',
      order: 3,
      isActive: true,
    });
  }

  static createDataScienceCategory(): CategoryCreateData {
    return new CategoryFactory().create({
      name: 'Data Science',
      slug: 'data-science',
      description: 'Analyze data and build machine learning models',
      icon: '📊',
      order: 4,
      isActive: true,
    });
  }

  static createDesignCategory(): CategoryCreateData {
    return new CategoryFactory().create({
      name: 'Design',
      slug: 'design',
      description: 'UI/UX design, graphic design, and creative skills',
      icon: '🎨',
      order: 5,
      isActive: true,
    });
  }

  /**
   * Create all standard categories
   */
  static async createStandardCategories(): Promise<Category[]> {
    const factory = new CategoryFactory();

    const categories = [
      this.createProgrammingCategory(),
      this.createWebDevelopmentCategory(),
      this.createMobileDevelopmentCategory(),
      this.createDataScienceCategory(),
      this.createDesignCategory(),
    ];

    const createdCategories: Category[] = [];
    for (const categoryData of categories) {
      const category = await factory.createAndSave(categoryData as any);
      createdCategories.push(category);
    }

    return createdCategories;
  }

  /**
   * Find root categories (no parent)
   */
  async findRootCategories(): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Find subcategories of a parent
   */
  async findSubcategories(parentId: number): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: { parentId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Find active categories
   */
  async findActive(): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Search categories by name or description
   */
  async search(query: string): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree(): Promise<Category[]> {
    const rootCategories = await this.findRootCategories();

    const tree = await Promise.all(
      rootCategories.map(async (category) => {
        const children = await this.findSubcategories(category.id);
        return {
          ...category,
          children,
        };
      })
    );

    return tree as any;
  }

  /**
   * Create category with courses count (for testing queries with relations)
   */
  async createWithCoursesCount(
    coursesCount: number = 0,
    overrides?: Partial<CategoryCreateData>
  ): Promise<Category> {
    const category = await this.createAndSave(overrides as any);

    // Note: Actual course creation would require CourseFactory
    // This is just a placeholder for the structure

    return category;
  }
}