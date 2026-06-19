package com.chatplatform.core.dto.bot;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateBotRequest {

    @NotBlank(message = "Bot name is required")
    @Size(max = 255)
    private String name;

    private String description;

    // Optional — defaults to deepseek-v3 via ollama if not specified
    private String modelProvider = "ollama";
    private String modelName     = "deepseek-v3";
    private Double temperature   = 0.7;

    private String systemPrompt;
    private String tone      = "professional";
    private String language  = "en";
}
