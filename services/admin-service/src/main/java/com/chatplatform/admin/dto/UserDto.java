package com.chatplatform.admin.dto;

import com.chatplatform.admin.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class UserDto {

    private UUID id;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String status;
    private OffsetDateTime lastLoginAt;
    private OffsetDateTime createdAt;

    public static UserDto from(User u) {
        return UserDto.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .avatarUrl(u.getAvatarUrl())
                .status(u.getStatus())
                .lastLoginAt(u.getLastLoginAt())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
