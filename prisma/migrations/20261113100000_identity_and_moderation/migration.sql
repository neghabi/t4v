-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_plan" VARCHAR(24) NOT NULL DEFAULT 'standard',
ADD COLUMN     "account_status" VARCHAR(16) NOT NULL DEFAULT 'active',
ADD COLUMN     "activity_type" VARCHAR(24) NOT NULL DEFAULT 'personal',
ADD COLUMN     "full_name" VARCHAR(120) NOT NULL DEFAULT '',
ADD COLUMN     "identity_status" VARCHAR(16) NOT NULL DEFAULT 'unsubmitted',
ADD COLUMN     "intended_use" VARCHAR(1000) NOT NULL DEFAULT '',
ADD COLUMN     "organization" VARCHAR(160) NOT NULL DEFAULT '',
ADD COLUMN     "phone" VARCHAR(20),
ADD COLUMN     "phone_verified_at" TIMESTAMP(3),
ADD COLUMN     "review_note" VARCHAR(1000) NOT NULL DEFAULT '',
ADD COLUMN     "terms_accepted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "short_links" ADD COLUMN     "moderation_note" VARCHAR(1000) NOT NULL DEFAULT '',
ADD COLUMN     "moderation_status" VARCHAR(16) NOT NULL DEFAULT 'pending',
ADD COLUMN     "reviewed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "identity_documents" (
    "id" VARCHAR(24) NOT NULL,
    "user_id" VARCHAR(24) NOT NULL,
    "kind" VARCHAR(24) NOT NULL,
    "mime_type" VARCHAR(40) NOT NULL,
    "size" INTEGER NOT NULL,
    "encrypted_data" BYTEA NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "note" VARCHAR(1000) NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "identity_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_challenges" (
    "user_id" VARCHAR(24) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "code_hash" CHAR(64) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_challenges_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "moderation_audits" (
    "id" BIGSERIAL NOT NULL,
    "actor" VARCHAR(64) NOT NULL,
    "subject_id" VARCHAR(32) NOT NULL,
    "action" VARCHAR(40) NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_configs" (
    "id" VARCHAR(16) NOT NULL,
    "provider" VARCHAR(16) NOT NULL DEFAULT 'disabled',
    "endpoint" VARCHAR(500) NOT NULL DEFAULT '',
    "encrypted_token" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "identity_documents_user_id_created_at_idx" ON "identity_documents"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "moderation_audits_subject_id_created_at_idx" ON "moderation_audits"("subject_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- AddForeignKey
ALTER TABLE "identity_documents" ADD CONSTRAINT "identity_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_challenges" ADD CONSTRAINT "phone_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

