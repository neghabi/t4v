CREATE TABLE "admin_accounts" (
  "id" VARCHAR(24) NOT NULL,
  "username" VARCHAR(64) NOT NULL,
  "password_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "admin_accounts_username_key" ON "admin_accounts"("username");
