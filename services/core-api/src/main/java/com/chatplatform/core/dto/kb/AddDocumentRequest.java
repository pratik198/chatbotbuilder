package com.chatplatform.core.dto.kb;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddDocumentRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String sourceType;   // "url" | "text"

    private String sourceUrl;    // required when sourceType = "url"
    private String rawText;      // required when sourceType = "text"
}
