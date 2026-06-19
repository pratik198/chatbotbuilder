package com.chatplatform.admin.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateTenantRequest {

    @Pattern(regexp = "active|suspended|deleted", message = "status must be active, suspended, or deleted")
    private String status;

    @Pattern(regexp = "free|starter|pro|enterprise", message = "Invalid plan")
    private String plan;
}
