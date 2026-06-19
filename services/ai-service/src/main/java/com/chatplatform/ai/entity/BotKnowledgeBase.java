package com.chatplatform.ai.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.util.UUID;

/**
 * Read-only view of the bot_knowledge_bases join table.
 * Tells us which KBs are linked to a bot (for RAG filtering).
 */
@Entity
@Table(name = "bot_knowledge_bases")
@Getter
public class BotKnowledgeBase {

    @EmbeddedId
    private BotKbId id;

    @Embeddable
    @Getter
    public static class BotKbId implements java.io.Serializable {
        @Column(name = "bot_id")
        private UUID botId;

        @Column(name = "knowledge_base_id")
        private UUID knowledgeBaseId;
    }
}
