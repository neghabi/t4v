-- An unverified signup must not reserve another person's phone number.
DROP INDEX "users_phone_key";
CREATE UNIQUE INDEX "users_verified_phone_key" ON "users"("phone") WHERE "phone_verified_at" IS NOT NULL;
