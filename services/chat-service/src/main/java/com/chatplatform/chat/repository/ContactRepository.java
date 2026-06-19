package com.chatplatform.chat.repository;

import com.chatplatform.chat.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ContactRepository extends JpaRepository<Contact, UUID> {
    Optional<Contact> findByTenantIdAndEmail(UUID tenantId, String email);
}
