package com.chatplatform.admin.controller;

import com.chatplatform.admin.dto.PagedResponse;
import com.chatplatform.admin.dto.UserDto;
import com.chatplatform.admin.service.UserAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/v1/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserAdminService userService;

    /**
     * GET /admin/v1/users?search=&status=active&page=0&size=20
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var result = userService.listUsers(search, status, pageable);
        return ResponseEntity.ok(Map.of("data", PagedResponse.from(result)));
    }

    /**
     * GET /admin/v1/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(Map.of("data", userService.getUser(id)));
    }

    /**
     * GET /admin/v1/users/{id}/memberships
     */
    @GetMapping("/{id}/memberships")
    public ResponseEntity<Map<String, Object>> memberships(@PathVariable UUID id) {
        return ResponseEntity.ok(Map.of("data", userService.getUserMemberships(id)));
    }

    /**
     * PATCH /admin/v1/users/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || !status.matches("active|suspended|deleted")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status"));
        }
        return ResponseEntity.ok(Map.of("data", userService.updateUserStatus(id, status)));
    }
}
