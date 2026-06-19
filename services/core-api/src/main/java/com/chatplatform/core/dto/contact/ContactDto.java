package com.chatplatform.core.dto.contact;

import com.chatplatform.core.entity.Contact;
import lombok.Data;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
public class ContactDto {

    private UUID id;
    private UUID tenantId;
    private String email;
    private String phone;
    private String firstName;
    private String lastName;
    private String company;
    private String source;
    private String stage;
    private Integer score;
    private String[] tags;
    private Map<String, Object> customFields;
    private String notes;
    private UUID assignedTo;
    private Instant createdAt;
    private Instant updatedAt;

    public static ContactDto from(Contact c) {
        ContactDto dto = new ContactDto();
        dto.id           = c.getId();
        dto.tenantId     = c.getTenantId();
        dto.email        = c.getEmail();
        dto.phone        = c.getPhone();
        dto.firstName    = c.getFirstName();
        dto.lastName     = c.getLastName();
        dto.company      = c.getCompany();
        dto.source       = c.getSource();
        dto.stage        = c.getStage();
        dto.score        = c.getScore();
        dto.tags         = c.getTags();
        dto.customFields = c.getCustomFields();
        dto.notes        = c.getNotes();
        dto.assignedTo   = c.getAssignedTo();
        dto.createdAt    = c.getCreatedAt();
        dto.updatedAt    = c.getUpdatedAt();
        return dto;
    }
}
