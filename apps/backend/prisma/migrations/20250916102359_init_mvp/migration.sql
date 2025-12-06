/*
  Warnings:

  - You are about to drop the column `sourceUrl` on the `Vocab` table. All the data in the column will be lost.
  - You are about to alter the column `word` on the `Vocab` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.
  - A unique constraint covering the columns `[userId,word]` on the table `Vocab` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Vocab` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SourceKind" AS ENUM ('YOUTUBE', 'PODCAST', 'ARTICLE', 'BOOK', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReviewResult" AS ENUM ('AGAIN', 'HARD', 'GOOD', 'EASY');

-- AlterTable
ALTER TABLE "public"."Vocab" DROP COLUMN "sourceUrl",
ADD COLUMN     "captureBatchId" INTEGER,
ADD COLUMN     "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ease" INTEGER NOT NULL DEFAULT 250,
ADD COLUMN     "intervalDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lapses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastResult" "public"."ReviewResult",
ADD COLUMN     "repetitions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sourceId" INTEGER,
ADD COLUMN     "timecodeSec" INTEGER,
ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "word" SET DATA TYPE VARCHAR(128),
ALTER COLUMN "explanationEn" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Source" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "kind" "public"."SourceKind" NOT NULL,
    "title" TEXT,
    "url" TEXT,
    "author" VARCHAR(256),
    "defaultTags" TEXT[],
    "defaultNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CaptureBatch" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sourceId" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "tags" TEXT[],

    CONSTRAINT "CaptureBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VocabReview" (
    "id" SERIAL NOT NULL,
    "vocabId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" "public"."ReviewResult" NOT NULL,
    "durationSec" INTEGER,
    "notes" TEXT,

    CONSTRAINT "VocabReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Source_userId_kind_idx" ON "public"."Source"("userId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Source_userId_url_key" ON "public"."Source"("userId", "url");

-- CreateIndex
CREATE INDEX "CaptureBatch_userId_startedAt_idx" ON "public"."CaptureBatch"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "VocabReview_userId_reviewedAt_idx" ON "public"."VocabReview"("userId", "reviewedAt");

-- CreateIndex
CREATE INDEX "VocabReview_vocabId_reviewedAt_idx" ON "public"."VocabReview"("vocabId", "reviewedAt");

-- CreateIndex
CREATE INDEX "Vocab_dueAt_idx" ON "public"."Vocab"("dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vocab_userId_word_key" ON "public"."Vocab"("userId", "word");

-- AddForeignKey
ALTER TABLE "public"."Source" ADD CONSTRAINT "Source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CaptureBatch" ADD CONSTRAINT "CaptureBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CaptureBatch" ADD CONSTRAINT "CaptureBatch_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vocab" ADD CONSTRAINT "Vocab_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vocab" ADD CONSTRAINT "Vocab_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vocab" ADD CONSTRAINT "Vocab_captureBatchId_fkey" FOREIGN KEY ("captureBatchId") REFERENCES "public"."CaptureBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VocabReview" ADD CONSTRAINT "VocabReview_vocabId_fkey" FOREIGN KEY ("vocabId") REFERENCES "public"."Vocab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VocabReview" ADD CONSTRAINT "VocabReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
