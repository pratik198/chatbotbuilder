package com.chatplatform.core.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Wraps a paginated list with metadata.
 * Use this inside ApiResponse.ok(pagedResponse).
 */
public record PagedResponse<T>(
    List<T> items,
    long total,
    int page,
    int size,
    int totalPages
) {
    // Convenience factory from Spring Data Page
    public static <T> PagedResponse<T> from(Page<T> page) {
        return new PagedResponse<>(
            page.getContent(),
            page.getTotalElements(),
            page.getNumber(),
            page.getSize(),
            page.getTotalPages()
        );
    }
}
