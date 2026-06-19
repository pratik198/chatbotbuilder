package com.chatplatform.chat.controller;

import com.chatplatform.chat.entity.Conversation;
import com.chatplatform.chat.entity.Message;
import com.chatplatform.chat.repository.ConversationRepository;
import com.chatplatform.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Authenticated endpoints for viewing conversations (used by the dashboard).
 */
@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationRepository conversationRepo;
    private final MessageRepository messageRepo;

    /**
     * GET /api/v1/conversations?botId=uuid&page=0&size=20
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listConversations(
            @RequestParam(required = false) UUID botId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            JwtAuthenticationToken jwt) {

        UUID tenantId = extractTenantId(jwt);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("startedAt").descending());

        Page<Conversation> result = (botId != null)
                ? conversationRepo.findByBotId(botId, pageable)
                : conversationRepo.findByTenantId(tenantId, pageable);

        return ResponseEntity.ok(Map.of(
            "items",      result.getContent(),
            "total",      result.getTotalElements(),
            "page",       result.getNumber(),
            "totalPages", result.getTotalPages()
        ));
    }

    /**
     * GET /api/v1/conversations/{id}/messages
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<Map<String, Object>> getMessages(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<Message> messages = messageRepo.findByConversationIdOrderByCreatedAtAsc(id, pageable);

        return ResponseEntity.ok(Map.of(
            "items",      messages.getContent(),
            "total",      messages.getTotalElements(),
            "totalPages", messages.getTotalPages()
        ));
    }

    private UUID extractTenantId(JwtAuthenticationToken jwt) {
        String tid = jwt.getToken().getClaimAsString("tenant_id");
        return tid != null ? UUID.fromString(tid) : null;
    }
}
