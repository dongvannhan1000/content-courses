-- CreateTable
CREATE TABLE "public"."PublicDeck" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "cefr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PublicDeckItem" (
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

    CONSTRAINT "PublicDeckItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicDeck_slug_key" ON "public"."PublicDeck"("slug");

-- CreateIndex
CREATE INDEX "PublicDeckItem_deckId_headword_idx" ON "public"."PublicDeckItem"("deckId", "headword");

-- CreateIndex
CREATE UNIQUE INDEX "PublicDeckItem_deckId_headword_pos_key" ON "public"."PublicDeckItem"("deckId", "headword", "pos");

-- AddForeignKey
ALTER TABLE "public"."PublicDeckItem" ADD CONSTRAINT "PublicDeckItem_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "public"."PublicDeck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
