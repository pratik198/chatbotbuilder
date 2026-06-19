package com.chatplatform.core.service;

import com.chatplatform.core.entity.ApiKey;
import com.chatplatform.core.repository.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private final ApiKeyRepository repo;

    /**
     * Creates a new API key. The raw key is returned ONCE and never stored.
     * @return map with "key" (raw, show once) and "id", "prefix", "name"
     */
    @Transactional
    public Map<String, Object> create(UUID tenantId, String name) {
        // Generate: "cp_" + 32 random hex chars
        byte[] bytes = new byte[16];
        RANDOM.nextBytes(bytes);
        String raw    = "cp_" + HexFormat.of().formatHex(bytes);
        String hash   = sha256(raw);
        String prefix = raw.substring(0, 12);

        ApiKey key = ApiKey.builder()
                .tenantId(tenantId)
                .name(name)
                .keyHash(hash)
                .keyPrefix(prefix)
                .build();
        key = repo.save(key);

        return Map.of(
            "id",     key.getId(),
            "name",   key.getName(),
            "prefix", prefix,
            "key",    raw       // shown once
        );
    }

    public List<ApiKey> list(UUID tenantId) {
        return repo.findByTenantId(tenantId);
    }

    @Transactional
    public void revoke(UUID id, UUID tenantId) {
        repo.findByIdAndTenantId(id, tenantId).ifPresent(repo::delete);
    }

    /**
     * Validates an incoming raw key. Returns the ApiKey if valid, empty otherwise.
     */
    @Transactional
    public Optional<ApiKey> validate(String rawKey) {
        if (rawKey == null || !rawKey.startsWith("cp_")) return Optional.empty();
        String hash = sha256(rawKey);
        Optional<ApiKey> found = repo.findByKeyHash(hash);
        found.ifPresent(k -> {
            k.setLastUsedAt(java.time.Instant.now());
            repo.save(k);
        });
        return found;
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
