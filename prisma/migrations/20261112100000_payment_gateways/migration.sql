CREATE TABLE gateway_configs (
 id VARCHAR(24) PRIMARY KEY,title VARCHAR(80) NOT NULL,enabled BOOLEAN NOT NULL DEFAULT false,
 mode VARCHAR(16) NOT NULL DEFAULT 'sandbox',credential_ciphertext TEXT,
 unit_price_rial INTEGER NOT NULL DEFAULT 1000 CHECK (unit_price_rial BETWEEN 1 AND 400000),
 priority INTEGER NOT NULL DEFAULT 10,updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO gateway_configs (id,title,enabled,priority) VALUES ('local','آزمایشی محلی',true,99),('zarinpal','زرین‌پال',false,10),('zibal','زیبال',false,20);
ALTER TABLE payments ADD COLUMN gateway_id VARCHAR(24),ADD COLUMN gateway_mode VARCHAR(16),ADD COLUMN credential_snapshot TEXT,ADD COLUMN authority VARCHAR(128),ADD COLUMN reference VARCHAR(128),ADD COLUMN callback_token VARCHAR(64),ADD COLUMN error_code VARCHAR(64),ADD COLUMN verified_at TIMESTAMP(3),ADD COLUMN verify_lease_until TIMESTAMP(3);
CREATE UNIQUE INDEX payments_provider_gateway_mode_authority_key ON payments(provider,gateway_mode,authority);
CREATE UNIQUE INDEX payments_provider_gateway_mode_reference_key ON payments(provider,gateway_mode,reference);
CREATE INDEX payments_status_created_at_idx ON payments(status,created_at DESC);
CREATE TABLE payment_events (id BIGSERIAL PRIMARY KEY,payment_id VARCHAR(24) NOT NULL REFERENCES payments(id) ON DELETE CASCADE,kind VARCHAR(40) NOT NULL,code VARCHAR(64),created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX payment_events_payment_id_created_at_idx ON payment_events(payment_id,created_at);
CREATE TABLE gateway_audit (id BIGSERIAL PRIMARY KEY,actor VARCHAR(64) NOT NULL,gateway_id VARCHAR(24) NOT NULL,action VARCHAR(40) NOT NULL,details JSONB NOT NULL,created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
