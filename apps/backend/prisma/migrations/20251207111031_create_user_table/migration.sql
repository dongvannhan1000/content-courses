-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "public"."users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");
