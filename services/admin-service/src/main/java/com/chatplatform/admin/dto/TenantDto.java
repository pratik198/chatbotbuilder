package com.chatplatform.admin.dto;

import com.chatplatform.admin.entity.Tenant;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class TenantDto {

    private UUID id;
    private String slug;
    private String name;
    private String plan;
    private String status;
    private String ownerEmail;
    private Map<String, Object> quota;
    private Map<String, Object> usage;
    private long memberCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static TenantDto from(Tenant t, long memberCount) {
        return TenantDto.builder()
                .id(t.getId())
                .slug(t.getSlug())
                .name(t.getName())
                .plan(t.getPlan())
                .status(t.getStatus())
                .ownerEmail(t.getOwnerEmail())
                .quota(t.getQuota())
                .usage(t.getUsage())
                .memberCount(memberCount)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
