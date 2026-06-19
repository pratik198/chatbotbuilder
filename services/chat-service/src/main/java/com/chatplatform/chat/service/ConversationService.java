package com.chatplatform.chat.service;

import com.chatplatform.chat.entity.Bot;
import com.chatplatform.chat.entity.Conversation;
import com.chatplatform.chat.entity.Message;
import com.chatplatform.chat.repository.ConversationRepository;
import com.chatplatform.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepo;
    private final MessageRepository messageRepo;

    /**
     * Returns an existing active conversation for this session,
     * or creates a new one.
     */
    @Transactional
    public Conversation getOrCreate(Bot bot, String sessionKey,
                                    String visitorIp, String userAgent) {

        Optional<Conversation> existing = conversationRepo
                .findBySessionKeyAndBotIdAndStatus(sessionKey, bot.getId(), "active");

        if (existing.isPresent()) {
            return existing.get();
        }

        Conversation conv = Conversation.builder()
                .tenantId(bot.getTenantId())
                .botId(bot.getId())
                .sessionKey(sessionKey)
                .channel("web")
                .status("active")
                .visitorIp(visitorIp)
                .userAgent(userAgent)
                .build();

        conv = conversationRepo.save(conv);
        log.debug("Created conversation {} for bot {}", conv.getId(), bot.getId());
        return conv;
    }

    /**
     * Saves a message and updates the conversation stats.
     */
    @Transactional
    public Message saveMessage(UUID conversationId, UUID tenantId, String role, String content,
                               String modelUsed, Integer promptTokens,
                               Integer completionTokens, Integer latencyMs) {

        Message msg = Message.builder()
                .conversationId(conversationId)
                .tenantId(tenantId)
                .role(role)
                .content(content)
                .modelUsed(modelUsed)
                .promptTokens(promptTokens)
                .completionTokens(completionTokens)
                .latencyMs(latencyMs)
                .build();

        msg = messageRepo.save(msg);

        // Update conversation stats
        conversationRepo.findById(conversationId).ifPresent(conv -> {
            conv.setMessageCount(conv.getMessageCount() + 1);
            conv.setLastMessageAt(Instant.now());
            conversationRepo.save(conv);
        });

        return msg;
    }

    /**
     * Gets the last N messages to use as AI context.
     */
    public List<Message> getRecentMessages(UUID conversationId) {
        return messageRepo.findTop10ByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    /**
     * Marks a conversation as handed off to a live agent.
     */
    @Transactional
    public void markHandedOff(UUID conversationId) {
        conversationRepo.findById(conversationId).ifPresent(conv -> {
            conv.setStatus("handed_off");
            conversationRepo.save(conv);
        });
    }

    /**
     * Ends a conversation when visitor disconnects.
     */
    @Transactional
    public void endConversation(UUID conversationId) {
        conversationRepo.findById(conversationId).ifPresent(conv -> {
            if ("active".equals(conv.getStatus())) {
                conv.setStatus("ended");
                conv.setEndedAt(Instant.now());
                conversationRepo.save(conv);
            }
        });
    }
}
