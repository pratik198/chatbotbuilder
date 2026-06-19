-- ================================================================
-- V2: Add tables that were missing from V1
-- ================================================================

-- ----------------------------------------------------------------
-- DOCUMENTS
-- The 'documents' table used by core-api and kb-service.
-- (V1 created 'kb_documents' — this is the canonical version)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id         UUID NOT NULL,
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    name              VARCHAR(500) NOT NULL,
    source_type       VARCHAR(30) NOT NULL,
    source_url        TEXT,
    status            VARCHAR(30) NOT NULL DEFAULT 'pending',
    chunk_count       INTEGER,
    error_message     TEXT,
    file_size_bytes   BIGINT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_kb     ON documents(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status, knowledge_base_id);

-- ----------------------------------------------------------------
-- DAILY STATS
-- Pre-aggregated analytics per tenant+bot per day.
-- Populated by analytics-service via RabbitMQ events.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_stats (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL,
    bot_id                  UUID NOT NULL,
    stat_date               DATE NOT NULL,
    conversations_started   INTEGER NOT NULL DEFAULT 0,
    conversations_ended     INTEGER NOT NULL DEFAULT 0,
    messages_user           INTEGER NOT NULL DEFAULT 0,
    messages_assistant      INTEGER NOT NULL DEFAULT 0,
    total_prompt_tokens     BIGINT NOT NULL DEFAULT 0,
    total_completion_tokens BIGINT NOT NULL DEFAULT 0,
    total_latency_ms        BIGINT NOT NULL DEFAULT 0,
    latency_sample_count    INTEGER NOT NULL DEFAULT 0,
    handoffs_requested      INTEGER NOT NULL DEFAULT 0,
    leads_captured          INTEGER NOT NULL DEFAULT 0,
    UNIQUE (tenant_id, bot_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_tenant ON daily_stats(tenant_id, stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_bot    ON daily_stats(bot_id, stat_date DESC);

-- ----------------------------------------------------------------
-- API KEYS
-- Tenant-level API keys for headless / server-side API access.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    key_hash    VARCHAR(128) NOT NULL UNIQUE,
    key_prefix  VARCHAR(12) NOT NULL,
    last_used_at TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ,
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant   ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash     ON api_keys(key_hash);

-- ----------------------------------------------------------------
-- EMAIL TOKENS
-- One-time tokens for password reset and email verification.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(128) NOT NULL UNIQUE,
    type        VARCHAR(30) NOT NULL,   -- 'password_reset' | 'email_verify'
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_hash ON email_tokens(token_hash);
