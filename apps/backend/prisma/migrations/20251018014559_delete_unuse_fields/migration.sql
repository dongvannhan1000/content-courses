/*
  Warnings:

  - You are about to drop the column `collocations` on the `public_deck_item` table. All the data in the column will be lost.
  - You are about to drop the column `example` on the `public_deck_item` table. All the data in the column will be lost.
  - You are about to drop the column `ipa` on the `public_deck_item` table. All the data in the column will be lost.
  - You are about to drop the column `lang` on the `public_deck_item` table. All the data in the column will be lost.
  - You are about to drop the column `license` on the `public_deck_item` table. All the data in the column will be lost.
  - You are about to drop the column `sourceAttribution` on the `public_deck_item` table. All the data in the column will be lost.
  - You are about to drop the column `sourceUrl` on the `public_deck_item` table. All the data in the column will be lost.
  - You are about to drop the column `captureBatchId` on the `vocab` table. All the data in the column will be lost.
  - You are about to drop the column `timecodeSec` on the `vocab` table. All the data in the column will be lost.
  - You are about to drop the `capture_batch` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."capture_batch" DROP CONSTRAINT "capture_batch_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vocab" DROP CONSTRAINT "vocab_captureBatchId_fkey";

-- AlterTable
ALTER TABLE "public"."public_deck_item" DROP COLUMN "collocations",
DROP COLUMN "example",
DROP COLUMN "ipa",
DROP COLUMN "lang",
DROP COLUMN "license",
DROP COLUMN "sourceAttribution",
DROP COLUMN "sourceUrl";

-- AlterTable
ALTER TABLE "public"."vocab" DROP COLUMN "captureBatchId",
DROP COLUMN "timecodeSec";

-- DropTable
DROP TABLE "public"."capture_batch";
