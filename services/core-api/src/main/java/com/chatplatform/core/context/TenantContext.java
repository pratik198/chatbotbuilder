package com.chatplatform.core.context;

import java.util.UUID;

/**
 * Holds the current tenant ID for the duration of a request.
 * Uses ThreadLocal so each thread (request) has its own isolated value.
 *
 * IMPORTANT: Always call clear() in a finally block to prevent leaks.
 */
public class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();

    public static void setTenantId(UUID tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static UUID getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
