/*
  Warnings:

  - You are about to drop the `CaptureBatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PublicDeck` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PublicDeckItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vocab` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VocabReview` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CaptureBatch" DROP CONSTRAINT "CaptureBatch_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PublicDeckItem" DROP CONSTRAINT "PublicDeckItem_deckId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Vocab" DROP CONSTRAINT "Vocab_captureBatchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Vocab" DROP CONSTRAINT "Vocab_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."VocabReview" DROP CONSTRAINT "VocabReview_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."VocabReview" DROP CONSTRAINT "VocabReview_vocabId_fkey";

-- DropTable
DROP TABLE "public"."CaptureBatch";

-- DropTable
DROP TABLE "public"."PublicDeck";

-- DropTable
DROP TABLE "public"."PublicDeckItem";

-- DropTable
DROP TABLE "public"."User";

-- DropTable
DROP TABLE "public"."Vocab";

-- DropTable
DROP TABLE "public"."VocabReview";

-- CreateTable
CREATE TABLE "public"."user" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."capture_batch" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "tags" TEXT[],

    CONSTRAINT "capture_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_deck" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "cefr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_deck_item" (
    "id" SERIAL NOT NULL,
    "deckId" INTEGER NOT NULL,
    "headword" VARCHAR(128) NOT NULL,
    "pos" TEXT,
    "definition" TEXT,
    "example" TEXT,
    "ipa" VARCHAR(128),
    "collocations" TEXT[],
    "tags" TEXT[],
    "source" TEXT,
    "sourceAttribution" TEXT,
    "sourceUrl" TEXT,
    "license" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_deck_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vocab" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "word" VARCHAR(128) NOT NULL,
    "meaningVi" TEXT NOT NULL,
    "explanationEn" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "timecodeSec" INTEGER,
    "captureBatchId" INTEGER,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "ease" INTEGER NOT NULL DEFAULT 250,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "lastResult" "public"."ReviewResult",

    CONSTRAINT "vocab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vocab_review" (
    "id" SERIAL NOT NULL,
    "vocabId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" "public"."ReviewResult" NOT NULL,
    "durationSec" INTEGER,
    "notes" TEXT,

    CONSTRAINT "vocab_review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "capture_batch_userId_startedAt_idx" ON "public"."capture_batch"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "public_deck_slug_key" ON "public"."public_deck"("slug");

-- CreateIndex
CREATE INDEX "public_deck_item_deckId_headword_idx" ON "public"."public_deck_item"("deckId", "headword");

-- CreateIndex
CREATE UNIQUE INDEX "public_deck_item_deckId_headword_pos_key" ON "public"."public_deck_item"("deckId", "headword", "pos");

-- CreateIndex
CREATE INDEX "vocab_addedAt_idx" ON "public"."vocab"("addedAt");

-- CreateIndex
CREATE INDEX "vocab_lastReviewedAt_idx" ON "public"."vocab"("lastReviewedAt");

-- CreateIndex
CREATE INDEX "vocab_dueAt_idx" ON "public"."vocab"("dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "vocab_userId_word_key" ON "public"."vocab"("userId", "word");

-- CreateIndex
CREATE INDEX "vocab_review_userId_reviewedAt_idx" ON "public"."vocab_review"("userId", "reviewedAt");

-- CreateIndex
CREATE INDEX "vocab_review_vocabId_reviewedAt_idx" ON "public"."vocab_review"("vocabId", "reviewedAt");

-- AddForeignKey
ALTER TABLE "public"."capture_batch" ADD CONSTRAINT "capture_batch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_deck_item" ADD CONSTRAINT "public_deck_item_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "public"."public_deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vocab" ADD CONSTRAINT "vocab_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vocab" ADD CONSTRAINT "vocab_captureBatchId_fkey" FOREIGN KEY ("captureBatchId") REFERENCES "public"."capture_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vocab_review" ADD CONSTRAINT "vocab_review_vocabId_fkey" FOREIGN KEY ("vocabId") REFERENCES "public"."vocab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vocab_review" ADD CONSTRAINT "vocab_review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
