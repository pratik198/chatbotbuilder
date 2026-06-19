package com.chatplatform.core.repository;

import com.chatplatform.core.entity.ContactActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ContactActivityRepository extends JpaRepository<ContactActivity, UUID> {
    Page<ContactActivity> findByContactIdOrderByCreatedAtDesc(UUID contactId, Pageable pageable);
}
