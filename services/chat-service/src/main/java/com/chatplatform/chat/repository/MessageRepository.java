package com.chatplatform.chat.repository;

import com.chatplatform.chat.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    // Get the last N messages for conversation context
    List<Message> findTop10ByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    Page<Message> findByConversationIdOrderByCreatedAtAsc(UUID conversationId, Pageable pageable);

    long countByConversationId(UUID conversationId);
}
