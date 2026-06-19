package com.chatplatform.core.dto.kb;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateKbRequest {

    @NotBlank(message = "Knowledge base name is required")
    private String name;

    private String description;
    private String embeddingModel = "nomic-embed-text";
    private Integer chunkSize    = 512;
    private Integer chunkOverlap = 50;
}
