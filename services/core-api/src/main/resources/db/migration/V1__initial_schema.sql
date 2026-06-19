-- ================================================================
-- chatplatform — PostgreSQL Initial Schema
-- Run by Docker Compose on first startup
-- For production: use Flyway migrations in each service
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------
-- TENANTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(63) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    plan            VARCHAR(50) NOT NULL DEFAULT 'free',
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    owner_email     VARCHAR(255) NOT NULL,
    api_key         VARCHAR(128) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    settings        JSONB NOT NULL DEFAULT '{}',
    quota           JSONB NOT NULL DEFAULT '{"monthly_messages":1000,"bots":3,"team_members":5}',
    usage           JSONB NOT NULL DEFAULT '{"messages_used":0,"bots_count":0}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenants_slug    ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key);

-- ----------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keycloak_id     VARCHAR(36) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    full_name       VARCHAR(255),
    avatar_url      TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);

-- ----------------------------------------------------------------
-- TENANT MEMBERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_members (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(50) NOT NULL DEFAULT 'member',
    invited_by  UUID REFERENCES users(id),
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    joined_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user   ON tenant_members(user_id);

-- ----------------------------------------------------------------
-- BOTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bots (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    avatar_url      TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',
    model_provider  VARCHAR(50) NOT NULL DEFAULT 'ollama',
    model_name      VARCHAR(100) NOT NULL DEFAULT 'deepseek-v3',
    temperature     NUMERIC(3,2) NOT NULL DEFAULT 0.7,
    max_tokens      INTEGER NOT NULL DEFAULT 2048,
    system_prompt   TEXT,
    tone            VARCHAR(50) DEFAULT 'professional',
    language        VARCHAR(10) DEFAULT 'en',
    rag_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
    lead_capture_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    live_chat_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    widget_config   JSONB NOT NULL DEFAULT '{"primary_color":"#4F46E5","position":"bottom-right","welcome_message":"Hi! How can I help you today?"}',
    embed_token     VARCHAR(128) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bots_tenant    ON bots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bots_embed_tok ON bots(embed_token);

-- ----------------------------------------------------------------
-- KNOWLEDGE BASES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    status          VARCHAR(30) NOT NULL DEFAULT 'idle',
    embedding_model VARCHAR(100) NOT NULL DEFAULT 'nomic-embed-text',
    chunk_size      INTEGER NOT NULL DEFAULT 512,
    chunk_overlap   INTEGER NOT NULL DEFAULT 50,
    doc_count       INTEGER NOT NULL DEFAULT 0,
    vector_count    INTEGER NOT NULL DEFAULT 0,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kb_tenant ON knowledge_bases(tenant_id);

-- ----------------------------------------------------------------
-- BOT <-> KNOWLEDGE BASE LINK
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bot_knowledge_bases (
    bot_id              UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    knowledge_base_id   UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    PRIMARY KEY (bot_id, knowledge_base_id)
);

-- ----------------------------------------------------------------
-- KB DOCUMENTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kb_documents (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    tenant_id         UUID NOT NULL,
    name              VARCHAR(500) NOT NULL,
    source_type       VARCHAR(30) NOT NULL,
    source_url        TEXT,
    storage_path      TEXT,
    content_hash      VARCHAR(64),
    status            VARCHAR(30) NOT NULL DEFAULT 'pending',
    char_count        INTEGER,
    chunk_count       INTEGER,
    error_message     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    indexed_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_kb_docs_kb     ON kb_documents(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_kb_docs_status ON kb_documents(status, knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_kb_docs_hash   ON kb_documents(content_hash);

-- ----------------------------------------------------------------
-- BOT ACTIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bot_actions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id      UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(50) NOT NULL,
    config      JSONB NOT NULL DEFAULT '{}',
    trigger_on  VARCHAR(50) NOT NULL DEFAULT 'lead_captured',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bot_actions_bot ON bot_actions(bot_id);

-- ----------------------------------------------------------------
-- CONTACTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           VARCHAR(255),
    phone           VARCHAR(50),
    first_name      VARCHAR(255),
    last_name       VARCHAR(255),
    company         VARCHAR(255),
    source          VARCHAR(50),
    stage           VARCHAR(30) NOT NULL DEFAULT 'new',
    score           INTEGER NOT NULL DEFAULT 0,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    custom_fields   JSONB NOT NULL DEFAULT '{}',
    notes           TEXT,
    assigned_to     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_contact_identifier CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email  ON contacts(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_stage  ON contacts(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_contacts_tags   ON contacts USING GIN(tags);

-- ----------------------------------------------------------------
-- CONVERSATIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    bot_id          UUID NOT NULL REFERENCES bots(id),
    session_key     VARCHAR(255) NOT NULL,
    channel         VARCHAR(50) NOT NULL DEFAULT 'web',
    status          VARCHAR(30) NOT NULL DEFAULT 'active',
    contact_id      UUID REFERENCES contacts(id),
    visitor_ip      INET,
    user_agent      TEXT,
    referrer_url    TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    message_count   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_conv_tenant  ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conv_bot     ON conversations(bot_id);
CREATE INDEX IF NOT EXISTS idx_conv_session ON conversations(session_key);
CREATE INDEX IF NOT EXISTS idx_conv_contact ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conv_status  ON conversations(status, tenant_id);

-- ----------------------------------------------------------------
-- MESSAGES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tenant_id           UUID NOT NULL,
    role                VARCHAR(20) NOT NULL,
    content             TEXT NOT NULL,
    content_type        VARCHAR(30) NOT NULL DEFAULT 'text',
    model_used          VARCHAR(100),
    prompt_tokens       INTEGER,
    completion_tokens   INTEGER,
    latency_ms          INTEGER,
    sources             JSONB,
    attachments         JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv    ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant  ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- ----------------------------------------------------------------
-- CONTACT ACTIVITIES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_activities (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL,
    contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    summary     TEXT,
    metadata    JSONB NOT NULL DEFAULT '{}',
    actor_id    UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_tenant  ON contact_activities(tenant_id, created_at DESC);

-- ----------------------------------------------------------------
-- HANDOFFS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS handoffs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL,
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    requested_by    VARCHAR(20) NOT NULL DEFAULT 'visitor',
    assigned_to     UUID REFERENCES users(id),
    status          VARCHAR(30) NOT NULL DEFAULT 'queued',
    priority        INTEGER NOT NULL DEFAULT 0,
    notes           TEXT,
    queued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_at     TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_handoffs_tenant ON handoffs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_handoffs_agent  ON handoffs(assigned_to, status);

-- ----------------------------------------------------------------
-- AGENT AVAILABILITY
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_availability (
    user_id     UUID PRIMARY KEY REFERENCES users(id),
    tenant_id   UUID NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'offline',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- CONVERSATION ANALYTICS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_analytics (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id),
    bot_id                  UUID NOT NULL REFERENCES bots(id),
    date                    DATE NOT NULL,
    total_conversations     INTEGER NOT NULL DEFAULT 0,
    total_messages          INTEGER NOT NULL DEFAULT 0,
    unique_visitors         INTEGER NOT NULL DEFAULT 0,
    leads_captured          INTEGER NOT NULL DEFAULT 0,
    handoffs                INTEGER NOT NULL DEFAULT 0,
    avg_duration_sec        INTEGER NOT NULL DEFAULT 0,
    avg_messages            NUMERIC(5,2) NOT NULL DEFAULT 0,
    csat_responses          INTEGER NOT NULL DEFAULT 0,
    csat_sum                INTEGER NOT NULL DEFAULT 0,
    total_prompt_tokens     BIGINT NOT NULL DEFAULT 0,
    total_completion_tokens BIGINT NOT NULL DEFAULT 0,
    UNIQUE (tenant_id, bot_id, date)
);
CREATE INDEX IF NOT EXISTS idx_analytics_tenant_date ON conversation_analytics(tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_bot_date    ON conversation_analytics(bot_id, date DESC);

-- ----------------------------------------------------------------
-- INTEGRATIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'inactive',
    config      JSONB NOT NULL DEFAULT '{}',
    credentials JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON integrations(tenant_id, type);

-- ----------------------------------------------------------------
-- WEBHOOK DELIVERIES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL,
    action_id       UUID REFERENCES bot_actions(id),
    event_type      VARCHAR(100) NOT NULL,
    payload         JSONB NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    response_code   INTEGER,
    response_body   TEXT,
    attempts        INTEGER NOT NULL DEFAULT 0,
    next_retry_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON webhook_deliveries(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhooks_retry  ON webhook_deliveries(next_retry_at) WHERE status = 'failed';

-- ----------------------------------------------------------------
-- SUBSCRIPTIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID UNIQUE NOT NULL REFERENCES tenants(id),
    plan_id                 VARCHAR(50) NOT NULL DEFAULT 'free',
    status                  VARCHAR(30) NOT NULL DEFAULT 'active',
    current_period_start    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end      TIMESTAMPTZ,
    cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
    custom_quota            JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
