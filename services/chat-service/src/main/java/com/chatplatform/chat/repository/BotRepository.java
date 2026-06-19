package com.chatplatform.chat.repository;

import com.chatplatform.chat.entity.Bot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BotRepository extends JpaRepository<Bot, UUID> {

    Optional<Bot> findByEmbedToken(String embedToken);
}
