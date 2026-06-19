package com.chatplatform.core.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * A lead / contact captured from chat conversations.
 * Stage tracks progression through the sales funnel.
 */
@Entity
@Table(name = "contacts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contact extends BaseEntity {

    private String email;
    private String phone;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    private String company;

    // Where this contact came from
    @Column(nullable = false)
    @Builder.Default
    private String source = "web";   // web | whatsapp | telegram | import | api

    // CRM stage
    @Column(nullable = false)
    @Builder.Default
    private String stage = "new";    // new | qualified | converted | lost

    // Lead score 0-100 (computed by LeadScoringService)
    @Column(nullable = false)
    @Builder.Default
    private Integer score = 0;

    // Free-form tags for filtering/segmentation
    @Column(columnDefinition = "text[]")
    @Builder.Default
    private String[] tags = new String[0];

    // Any extra fields from lead capture forms
    @Type(JsonBinaryType.class)
    @Column(name = "custom_fields", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> customFields = new HashMap<>();

    private String notes;

    @Column(name = "assigned_to")
    private UUID assignedTo;
}
