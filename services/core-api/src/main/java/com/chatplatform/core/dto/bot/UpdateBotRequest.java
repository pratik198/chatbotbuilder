package com.chatplatform.core.dto.bot;

import lombok.Data;

import java.util.Map;

@Data
public class UpdateBotRequest {

    private String name;
    private String description;
    private String modelProvider;
    private String modelName;
    private Double temperature;
    private Integer maxTokens;
    private String systemPrompt;
    private String tone;
    private String language;
    private Boolean ragEnabled;
    private Boolean leadCaptureEnabled;
    private Boolean liveChatEnabled;
    private Map<String, Object> widgetConfig;
}
