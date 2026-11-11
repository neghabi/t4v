-- CreateTable
CREATE TABLE "credit_top_ups" (
    "id" VARCHAR(24) NOT NULL,
    "user_id" VARCHAR(24) NOT NULL,
    "requested_credits" INTEGER NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "credit_top_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_top_ups_user_id_created_at_idx" ON "credit_top_ups"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "credit_top_ups_status_created_at_idx" ON "credit_top_ups"("status", "created_at" ASC);

-- AddForeignKey
ALTER TABLE "credit_top_ups" ADD CONSTRAINT "credit_top_ups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
