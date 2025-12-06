import { z } from "zod";

export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3001"),
  DATABASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url().optional(),
});
export type Env = z.infer<typeof EnvSchema>;

export const ReviewResultSchema = z.enum(["AGAIN", "HARD", "GOOD", "EASY"]);
export type ReviewResult = z.infer<typeof ReviewResultSchema>;

export const VocabEntitySchema = z.object({
  id: z.number().int().nonnegative(),
  userId: z.number().int().nonnegative(),

  // backend: maxLength 128
  word: z.string().min(1).max(128),
  meaningVi: z.string().min(1),

  explanationEn: z.string().nullable(),
  notes: z.string().nullable(),

  tags: z.array(z.string()),

  // timecodeSec: z.number().int().nonnegative().nullable(),
  // captureBatchId: z.number().int().nullable(),

  // Backend là Date → JSON ISO string
  addedAt: z.string().datetime(),
  lastReviewedAt: z.string().datetime().nullable(),

  isSuspended: z.boolean(),

  // SRS fields
  dueAt: z.string().datetime(),
  intervalDays: z.number().int().nonnegative(),
  ease: z.number().int().nonnegative(),
  repetitions: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),

  lastResult: ReviewResultSchema.nullable(),
});
export type VocabEntity = z.infer<typeof VocabEntitySchema>;

export const PaginatedVocabSchema = z.object({
  items: z.array(VocabEntitySchema),
  skip: z.number().int().min(0),
  take: z.number().int().min(1),
  total: z.number().int().nonnegative(),
});
export type PaginatedVocab = z.infer<typeof PaginatedVocabSchema>;
