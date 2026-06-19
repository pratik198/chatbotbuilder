package com.chatplatform.core.filter;

import com.chatplatform.core.context.TenantContext;
import com.chatplatform.core.entity.ApiKey;
import com.chatplatform.core.service.ApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * If the request carries an "X-API-Key: cp_..." header (and no JWT),
 * validate it and set the tenant context so the request proceeds normally.
 *
 * Runs before TenantFilter (@Order 1).
 */
@Component
@Order(1)
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ApiKeyService apiKeyService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String apiKey = request.getHeader("X-API-Key");

        if (apiKey != null && apiKey.startsWith("cp_")
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            Optional<ApiKey> validated = apiKeyService.validate(apiKey);
            if (validated.isPresent()) {
                ApiKey key = validated.get();
                TenantContext.setTenantId(key.getTenantId());

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        "api-key:" + key.getId(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_api_key"))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        chain.doFilter(request, response);
    }
}
