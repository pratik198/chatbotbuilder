package com.chatplatform.admin.service;

import com.chatplatform.admin.dto.UserDto;
import com.chatplatform.admin.entity.User;
import com.chatplatform.admin.repository.TenantMemberRepository;
import com.chatplatform.admin.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository userRepo;
    private final TenantMemberRepository memberRepo;

    public Page<UserDto> listUsers(String search, String status, Pageable pageable) {
        return userRepo.search(search, status, pageable).map(UserDto::from);
    }

    public UserDto getUser(UUID id) {
        User u = userRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
        return UserDto.from(u);
    }

    @Transactional
    public UserDto updateUserStatus(UUID id, String status) {
        User u = userRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
        u.setStatus(status);
        userRepo.save(u);
        log.info("Admin set user {} status to {}", id, status);
        return UserDto.from(u);
    }

    public java.util.List<com.chatplatform.admin.entity.TenantMember> getUserMemberships(UUID userId) {
        return memberRepo.findByUserId(userId);
    }
}
