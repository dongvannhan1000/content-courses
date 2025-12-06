-- DropForeignKey
ALTER TABLE "public"."CaptureBatch" DROP CONSTRAINT "CaptureBatch_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Vocab" DROP CONSTRAINT "Vocab_sourceId_fkey";

-- DropColumn
ALTER TABLE "public"."CaptureBatch" DROP COLUMN "sourceId";

-- DropColumn
ALTER TABLE "public"."Vocab" DROP COLUMN "sourceId";

-- DropTable
DROP TABLE "public"."Source";

-- DropEnum
DROP TYPE "public"."SourceKind";
