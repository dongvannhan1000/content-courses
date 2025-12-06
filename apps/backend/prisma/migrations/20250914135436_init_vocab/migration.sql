-- CreateTable
CREATE TABLE "public"."Vocab" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "meaningVi" TEXT NOT NULL,
    "explanationEn" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "tags" TEXT[],
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Vocab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vocab_addedAt_idx" ON "public"."Vocab"("addedAt");

-- CreateIndex
CREATE INDEX "Vocab_lastReviewedAt_idx" ON "public"."Vocab"("lastReviewedAt");
