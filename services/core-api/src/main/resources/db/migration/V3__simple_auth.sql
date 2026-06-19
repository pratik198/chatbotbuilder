-- ================================================================
-- V3: Switch from Keycloak to simple JWT auth
-- ================================================================

-- Make keycloak_id nullable (no longer required)
ALTER TABLE users ALTER COLUMN keycloak_id DROP NOT NULL;

-- Add password hash for local auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Make the unique constraint on keycloak_id partial (ignore NULLs)
DROP INDEX IF EXISTS idx_users_keycloak_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_keycloak_id
    ON users(keycloak_id)
    WHERE keycloak_id IS NOT NULL;
