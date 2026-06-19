-- ================================================================
-- V5: Seed the platform's own support bot
-- Used by the floating chat widget on the dashboard.
-- ================================================================

-- Create a system tenant for the platform itself
INSERT INTO tenants (id, name, slug, plan, status, owner_email, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'ChatPlatform',
    'chatplatform-system',
    'enterprise',
    'active',
    'system@chatplatform.local',
    NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Seed the platform support bot
INSERT INTO bots (
    id, tenant_id, name, description, status,
    model_provider, model_name, temperature, max_tokens,
    system_prompt, tone, language, rag_enabled,
    lead_capture_enabled, live_chat_enabled,
    embed_token, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'ChatPlatform Support',
    'Platform support assistant',
    'active',
    'ollama', 'llama3.2:3b', 0.7, 1024,
    'You are a helpful support assistant for ChatPlatform, an AI chatbot builder SaaS. Help users with questions about creating bots, managing conversations, using knowledge bases, and platform features. Be concise and friendly.',
    'friendly', 'en', false,
    false, false,
    '8e741da4f640410cb1239d0112a71df6',
    NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
