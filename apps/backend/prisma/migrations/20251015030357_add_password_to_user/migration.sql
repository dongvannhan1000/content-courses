/*
  Warnings:

  - Added the required column `password` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- First add column with a default value for existing rows
ALTER TABLE "public"."user" ADD COLUMN "password" TEXT NOT NULL DEFAULT '$2b$10$temporary.hashed.password.placeholder';

-- Remove default for future inserts
ALTER TABLE "public"."user" ALTER COLUMN "password" DROP DEFAULT;
