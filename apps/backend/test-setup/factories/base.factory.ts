import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { DatabaseHelper } from '../helpers/database.helper';

/**
 * Abstract base factory for creating test data
 * Provides common functionality for all factory classes
 */
export abstract class BaseFactory<T> {
  protected prisma: PrismaClient = DatabaseHelper.getClient();

  /**
   * Create a single entity with optional overrides
   * Must be implemented by concrete factory classes
   */
  abstract create(overrides?: Partial<any>): any;

  /**
   * Create and save a single entity to database
   */
  async createAndSave(overrides?: Partial<any>): Promise<T> {
    const data = this.create(overrides);
    const modelName = this.getModelName();

    try {
      // Use type assertion to access Prisma model dynamically
      const model = (this.prisma as any)[modelName];
      return await model.create({ data });
    } catch (error) {
      console.error(`Failed to create ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Create multiple entities
   */
  async createMany(count: number, overrides?: Partial<any>): Promise<T[]> {
    const items: T[] = [];

    for (let i = 0; i < count; i++) {
      items.push(await this.createAndSave(overrides));
    }

    return items;
  }

  /**
   * Create entities in batch (more efficient for large numbers)
   */
  async createBatch(count: number, overrides?: Partial<any>): Promise<T[]> {
    const items: any[] = [];
    const modelName = this.getModelName();

    for (let i = 0; i < count; i++) {
      items.push(this.create(overrides));
    }

    try {
      const model = (this.prisma as any)[modelName];
      await model.createMany({
        data: items,
        skipDuplicates: true,
      });
      // Return the items (note: createMany doesn't return created records)
      return items as T[];
    } catch (error) {
      console.error(`Failed to batch create ${modelName}:`, error);
      // Fallback to individual creation
      return this.createMany(count, overrides);
    }
  }

  /**
   * Get the Prisma model name
   * Must be implemented by concrete factory classes
   */
  abstract getModelName(): string;

  /**
   * Find an existing entity by ID
   */
  async findById(id: number): Promise<T | null> {
    const modelName = this.getModelName();
    const model = (this.prisma as any)[modelName];
    return await model.findUnique({
      where: { id },
    });
  }

  /**
   * Find entities with filtering
   */
  async findMany(where: any = {}, orderBy: any = {}, limit?: number): Promise<T[]> {
    const modelName = this.getModelName();
    const model = (this.prisma as any)[modelName];

    const query: any = { where, orderBy };
    if (limit) {
      query.take = limit;
    }

    return await model.findMany(query);
  }

  /**
   * Update an entity
   */
  async update(id: number, data: Partial<any>): Promise<T> {
    const modelName = this.getModelName();
    const model = (this.prisma as any)[modelName];

    return await model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an entity
   */
  async delete(id: number): Promise<T> {
    const modelName = this.getModelName();
    const model = (this.prisma as any)[modelName];

    return await model.delete({
      where: { id },
    });
  }

  /**
   * Count entities
   */
  async count(where: any = {}): Promise<number> {
    const modelName = this.getModelName();
    const model = (this.prisma as any)[modelName];

    return await model.count({ where });
  }

  /**
   * Generate random number
   */
  protected randomInt(min: number, max: number): number {
    return faker.number.int({ min, max });
  }

  /**
   * Generate random string
   */
  protected randomString(length: number = 10): string {
    return faker.string.alphanumeric(length);
  }

  /**
   * Generate random boolean
   */
  protected randomBoolean(probability: number = 0.5): boolean {
    return Math.random() < probability;
  }

  /**
   * Generate random date
   */
  protected randomDate(from?: Date, to?: Date): Date {
    return faker.date.between({ from: from || new Date(2020, 0, 1), to: to || new Date() });
  }

  /**
   * Generate random email
   */
  protected randomEmail(firstName?: string, lastName?: string): string {
    return faker.internet.email({ firstName, lastName });
  }

  /**
   * Generate random phone number
   */
  protected randomPhoneNumber(): string {
    return faker.phone.number({ style: 'international' });
  }

  /**
   * Generate random URL
   */
  protected randomUrl(): string {
    return faker.internet.url();
  }

  /**
   * Generate random UUID
   */
  protected randomUuid(): string {
    return faker.string.uuid();
  }

  /**
   * Generate random slug from text
   */
  protected generateSlug(text: string): string {
    return faker.helpers.slugify(text).toLowerCase();
  }

  /**
   * Generate random lorem text
   */
  protected loremWords(count: number = 3): string {
    return faker.lorem.words(count);
  }

  protected loremSentences(count: number = 1): string {
    return faker.lorem.sentences(count);
  }

  protected loremParagraph(count: number = 3): string {
    return faker.lorem.paragraph(count);
  }

  protected loremParagraphs(count: number = 2): string {
    return faker.lorem.paragraphs(count);
  }
}