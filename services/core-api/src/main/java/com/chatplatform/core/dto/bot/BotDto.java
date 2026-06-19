package com.chatplatform.core.dto.bot;

import com.chatplatform.core.entity.Bot;
import lombok.Data;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * What the API returns when a bot is requested.
 * Simple manual mapping from Bot entity — no MapStruct needed.
 */
@Data
public class BotDto {

    private UUID id;
    private UUID tenantId;
    private String name;
    private String description;
    private String avatarUrl;
    private String status;
    private String modelProvider;
    private String modelName;
    private Double temperature;
    private Integer maxTokens;
    private String systemPrompt;
    private String tone;
    private String language;
    private boolean ragEnabled;
    private boolean leadCaptureEnabled;
    private boolean liveChatEnabled;
    private Map<String, Object> widgetConfig;
    private String embedToken;
    private Instant createdAt;
    private Instant updatedAt;

    // Static factory — keeps mapping logic close to the DTO
    public static BotDto from(Bot bot) {
        BotDto dto = new BotDto();
        dto.id                  = bot.getId();
        dto.tenantId            = bot.getTenantId();
        dto.name                = bot.getName();
        dto.description         = bot.getDescription();
        dto.avatarUrl           = bot.getAvatarUrl();
        dto.status              = bot.getStatus();
        dto.modelProvider       = bot.getModelProvider();
        dto.modelName           = bot.getModelName();
        dto.temperature         = bot.getTemperature();
        dto.maxTokens           = bot.getMaxTokens();
        dto.systemPrompt        = bot.getSystemPrompt();
        dto.tone                = bot.getTone();
        dto.language            = bot.getLanguage();
        dto.ragEnabled          = bot.isRagEnabled();
        dto.leadCaptureEnabled  = bot.isLeadCaptureEnabled();
        dto.liveChatEnabled     = bot.isLiveChatEnabled();
        dto.widgetConfig        = bot.getWidgetConfig();
        dto.embedToken          = bot.getEmbedToken();
        dto.createdAt           = bot.getCreatedAt();
        dto.updatedAt           = bot.getUpdatedAt();
        return dto;
    }
}
