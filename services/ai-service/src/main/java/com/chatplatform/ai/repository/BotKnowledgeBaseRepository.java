package com.chatplatform.ai.repository;

import com.chatplatform.ai.entity.BotKnowledgeBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BotKnowledgeBaseRepository
        extends JpaRepository<BotKnowledgeBase, BotKnowledgeBase.BotKbId> {

    // Get all KB ids linked to a bot — used to filter Qdrant search
    @Query("SELECT bkb.id.knowledgeBaseId FROM BotKnowledgeBase bkb WHERE bkb.id.botId = :botId")
    List<UUID> findKbIdsByBotId(@Param("botId") UUID botId);
}
