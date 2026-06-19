package com.chatplatform.chat.repository;

import com.chatplatform.chat.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    // Find existing session (visitor returning mid-conversation)
    Optional<Conversation> findBySessionKeyAndBotIdAndStatus(
            String sessionKey, UUID botId, String status);

    Page<Conversation> findByTenantId(UUID tenantId, Pageable pageable);

    Page<Conversation> findByBotId(UUID botId, Pageable pageable);

    long countByTenantId(UUID tenantId);
}
