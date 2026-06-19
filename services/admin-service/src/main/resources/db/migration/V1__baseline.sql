-- Admin-service reads shared tables (tenants, users, tenant_members, daily_stats).
-- Schema is managed by core-api's Flyway migrations.
-- This baseline lets Flyway track admin-service's own migration state
-- without recreating tables that already exist.
SELECT 1;
