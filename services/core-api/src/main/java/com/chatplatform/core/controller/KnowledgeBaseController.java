package com.chatplatform.core.controller;

import com.chatplatform.core.context.TenantContext;
import com.chatplatform.core.dto.ApiResponse;
import com.chatplatform.core.dto.PagedResponse;
import com.chatplatform.core.dto.kb.AddDocumentRequest;
import com.chatplatform.core.dto.kb.CreateKbRequest;
import com.chatplatform.core.dto.kb.DocumentDto;
import com.chatplatform.core.dto.kb.KbDto;
import com.chatplatform.core.entity.Document;
import com.chatplatform.core.entity.KnowledgeBase;
import com.chatplatform.core.entity.User;
import com.chatplatform.core.service.DocumentService;
import com.chatplatform.core.service.KnowledgeBaseService;
import com.chatplatform.core.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/knowledge-bases")
@RequiredArgsConstructor
public class KnowledgeBaseController {

    private final KnowledgeBaseService kbService;
    private final DocumentService docService;
    private final UserService userService;

    /**
     * GET /api/v1/knowledge-bases
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<KbDto>>> listKbs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID tenantId = TenantContext.getTenantId();
        Page<KnowledgeBase> kbPage = kbService.listKbs(tenantId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.from(kbPage.map(KbDto::from))));
    }

    /**
     * GET /api/v1/knowledge-bases/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<KbDto>> getKb(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        KnowledgeBase kb = kbService.getKbOrThrow(id, tenantId);
        return ResponseEntity.ok(ApiResponse.ok(KbDto.from(kb)));
    }

    /**
     * POST /api/v1/knowledge-bases
     */
    @PostMapping
    public ResponseEntity<ApiResponse<KbDto>> createKb(
            @Valid @RequestBody CreateKbRequest req,
            @AuthenticationPrincipal JwtAuthenticationToken jwt) {

        UUID tenantId = TenantContext.getTenantId();
        User user = userService.getCurrentUser(jwt);
        KnowledgeBase kb = kbService.createKb(req, tenantId, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(KbDto.from(kb)));
    }

    /**
     * DELETE /api/v1/knowledge-bases/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteKb(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        kbService.deleteKb(id, tenantId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ── Document endpoints ────────────────────────────────────────

    /**
     * GET /api/v1/knowledge-bases/{id}/documents
     */
    @GetMapping("/{id}/documents")
    public ResponseEntity<ApiResponse<List<DocumentDto>>> listDocuments(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        List<DocumentDto> docs = docService.listDocuments(id, tenantId)
                .stream().map(DocumentDto::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(docs));
    }

    /**
     * POST /api/v1/knowledge-bases/{id}/documents
     * Add a URL or raw text document.
     */
    @PostMapping("/{id}/documents")
    public ResponseEntity<ApiResponse<DocumentDto>> addDocument(
            @PathVariable UUID id,
            @Valid @RequestBody AddDocumentRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        Document doc = docService.addDocument(id, tenantId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(DocumentDto.from(doc)));
    }

    /**
     * POST /api/v1/knowledge-bases/{id}/documents/upload
     * Upload a PDF or DOCX file.
     */
    @PostMapping(value = "/{id}/documents/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentDto>> uploadFile(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        UUID tenantId = TenantContext.getTenantId();
        Document doc = docService.uploadFile(id, tenantId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(DocumentDto.from(doc)));
    }

    /**
     * DELETE /api/v1/knowledge-bases/{kbId}/documents/{docId}
     */
    @DeleteMapping("/{kbId}/documents/{docId}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable UUID kbId,
            @PathVariable UUID docId) {
        UUID tenantId = TenantContext.getTenantId();
        docService.deleteDocument(docId, tenantId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
