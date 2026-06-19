package com.chatplatform.core.controller;

import com.chatplatform.core.context.TenantContext;
import com.chatplatform.core.dto.ApiResponse;
import com.chatplatform.core.dto.PagedResponse;
import com.chatplatform.core.dto.contact.ContactDto;
import com.chatplatform.core.entity.Contact;
import com.chatplatform.core.entity.ContactActivity;
import com.chatplatform.core.exception.ResourceNotFoundException;
import com.chatplatform.core.repository.ContactActivityRepository;
import com.chatplatform.core.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactRepository contactRepo;
    private final ContactActivityRepository activityRepo;

    /**
     * GET /api/v1/contacts?stage=new&search=john&page=0&size=20
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ContactDto>>> list(
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID tenantId = TenantContext.getTenantId();
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Contact> result;
        if (search != null && !search.isBlank()) {
            result = contactRepo.searchByTenantId(tenantId, search, pageable);
        } else if (stage != null && !stage.isBlank()) {
            result = contactRepo.findByTenantIdAndStage(tenantId, stage, pageable);
        } else {
            result = contactRepo.findByTenantId(tenantId, pageable);
        }

        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.from(result.map(ContactDto::from))));
    }

    /**
     * GET /api/v1/contacts/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactDto>> getOne(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Contact c = contactRepo.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", id));
        return ResponseEntity.ok(ApiResponse.ok(ContactDto.from(c)));
    }

    /**
     * POST /api/v1/contacts
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ContactDto>> create(@RequestBody Map<String, Object> body) {
        UUID tenantId = TenantContext.getTenantId();

        Contact c = Contact.builder()
                .email(str(body, "email"))
                .phone(str(body, "phone"))
                .firstName(str(body, "firstName"))
                .lastName(str(body, "lastName"))
                .company(str(body, "company"))
                .notes(str(body, "notes"))
                .source(body.getOrDefault("source", "import").toString())
                .stage(body.getOrDefault("stage", "new").toString())
                .build();

        c = contactRepo.save(c);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(ContactDto.from(c)));
    }

    /**
     * PATCH /api/v1/contacts/{id}
     * Partial update — only the fields provided in the body are updated.
     */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactDto>> update(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {

        UUID tenantId = TenantContext.getTenantId();
        Contact c = contactRepo.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", id));

        if (body.containsKey("email"))     c.setEmail(str(body, "email"));
        if (body.containsKey("phone"))     c.setPhone(str(body, "phone"));
        if (body.containsKey("firstName")) c.setFirstName(str(body, "firstName"));
        if (body.containsKey("lastName"))  c.setLastName(str(body, "lastName"));
        if (body.containsKey("company"))   c.setCompany(str(body, "company"));
        if (body.containsKey("notes"))     c.setNotes(str(body, "notes"));
        if (body.containsKey("stage"))     c.setStage(str(body, "stage"));
        if (body.containsKey("score")) {
            c.setScore(((Number) body.get("score")).intValue());
        }

        c = contactRepo.save(c);
        return ResponseEntity.ok(ApiResponse.ok(ContactDto.from(c)));
    }

    /**
     * DELETE /api/v1/contacts/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Contact c = contactRepo.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", id));
        contactRepo.delete(c);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * GET /api/v1/contacts/stats
     * Quick counts by stage — used in the CRM summary cards.
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats() {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "total",     contactRepo.countByTenantId(tenantId),
            "new",       contactRepo.countByTenantIdAndStage(tenantId, "new"),
            "qualified", contactRepo.countByTenantIdAndStage(tenantId, "qualified"),
            "converted", contactRepo.countByTenantIdAndStage(tenantId, "converted"),
            "lost",      contactRepo.countByTenantIdAndStage(tenantId, "lost")
        )));
    }

    /** GET /api/v1/contacts/{id}/activities */
    @GetMapping("/{id}/activities")
    public ResponseEntity<ApiResponse<PagedResponse<ContactActivity>>> activities(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<ContactActivity> result = activityRepo
                .findByContactIdOrderByCreatedAtDesc(id, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.from(result)));
    }

    /** POST /api/v1/contacts/{id}/activities */
    @PostMapping("/{id}/activities")
    public ResponseEntity<ApiResponse<ContactActivity>> addActivity(
            @PathVariable UUID id,
            @RequestBody ActivityRequest req,
            JwtAuthenticationToken auth) {

        UUID actorId = UUID.fromString(auth.getToken().getSubject());
        ContactActivity activity = activityRepo.save(ContactActivity.builder()
                .tenantId(TenantContext.getTenantId())
                .contactId(id)
                .type(req.type())
                .summary(req.summary())
                .metadata(req.metadata() != null ? req.metadata() : Map.of())
                .actorId(actorId)
                .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(activity));
    }

    private String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v != null ? v.toString() : null;
    }

    record ActivityRequest(String type, String summary, Map<String, Object> metadata) {}
}
