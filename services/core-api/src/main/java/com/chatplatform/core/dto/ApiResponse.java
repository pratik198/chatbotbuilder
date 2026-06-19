package com.chatplatform.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.time.Instant;

/**
 * Standard response envelope for all API endpoints.
 *
 * Success:  { "success": true,  "data": {...} }
 * Error:    { "success": false, "error": { "code": "...", "message": "..." } }
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final ErrorBody error;
    private final String timestamp = Instant.now().toString();

    private ApiResponse(boolean success, T data, ErrorBody error) {
        this.success = success;
        this.data = data;
        this.error = error;
    }

    // ── Factory methods ──────────────────────────────────────────

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> ok() {
        return new ApiResponse<>(true, null, null);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, null, new ErrorBody(code, message));
    }

    // ── Inner class ──────────────────────────────────────────────

    public record ErrorBody(String code, String message) {}
}
