package com.chatplatform.core.filter;

import com.chatplatform.core.context.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Simple rate limiter: N requests per minute per tenant.
 * Uses Redis counters with 60-second TTL.
 */
@Component
@Order(3)
public class RateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redis;

    @Value("${app.rate-limit.requests-per-minute:200}")
    private int requestsPerMinute;

    public RateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Only rate-limit authenticated requests (tenant is known)
        if (TenantContext.getTenantId() == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = "ratelimit:" + TenantContext.getTenantId() + ":api";
        Long count = redis.opsForValue().increment(key);

        // Set expiry on first request of the window
        if (count != null && count == 1) {
            redis.expire(key, 60, TimeUnit.SECONDS);
        }

        if (count != null && count > requestsPerMinute) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                """
                {"success":false,"error":{"code":"RATE_LIMIT_EXCEEDED","message":"Too many requests. Limit: %d/min"}}
                """.formatted(requestsPerMinute)
            );
            return;
        }

        filterChain.doFilter(request, response);
    }
}
