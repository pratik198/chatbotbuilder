package com.chatplatform.core.service;

import com.chatplatform.core.dto.bot.CreateBotRequest;
import com.chatplatform.core.dto.bot.UpdateBotRequest;
import com.chatplatform.core.entity.Bot;
import com.chatplatform.core.exception.BusinessException;
import com.chatplatform.core.exception.ResourceNotFoundException;
import com.chatplatform.core.repository.BotRepository;
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
public class BotService {

    private final BotRepository botRepo;

    private static final int MAX_BOTS_FREE_PLAN = 3;

    public Page<Bot> listBots(UUID tenantId, Pageable pageable) {
        return botRepo.findByTenantId(tenantId, pageable);
    }

    public Bot getBotOrThrow(UUID botId, UUID tenantId) {
        return botRepo.findByIdAndTenantId(botId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Bot", botId));
    }

    @Transactional
    public Bot createBot(CreateBotRequest req, UUID tenantId, UUID userId) {
        // Quota check — free plan allows 3 bots
        long existing = botRepo.countByTenantIdAndStatusNot(tenantId, "archived");
        if (existing >= MAX_BOTS_FREE_PLAN) {
            throw new BusinessException("BOT_QUOTA_EXCEEDED",
                    "You have reached the maximum number of bots for your plan (" + MAX_BOTS_FREE_PLAN + ")");
        }

        Bot bot = Bot.builder()
                .name(req.getName())
                .description(req.getDescription())
                .modelProvider(req.getModelProvider())
                .modelName(req.getModelName())
                .temperature(req.getTemperature())
                .systemPrompt(req.getSystemPrompt())
                .tone(req.getTone())
                .language(req.getLanguage())
                .createdBy(userId)
                .build();

        // tenantId is auto-set by BaseEntity.prePersist() from TenantContext
        bot = botRepo.save(bot);
        log.info("Created bot '{}' (id={}) for tenant {}", bot.getName(), bot.getId(), tenantId);
        return bot;
    }

    @Transactional
    public Bot updateBot(UUID botId, UUID tenantId, UpdateBotRequest req) {
        Bot bot = getBotOrThrow(botId, tenantId);

        if (req.getName() != null)               bot.setName(req.getName());
        if (req.getDescription() != null)        bot.setDescription(req.getDescription());
        if (req.getModelProvider() != null)      bot.setModelProvider(req.getModelProvider());
        if (req.getModelName() != null)          bot.setModelName(req.getModelName());
        if (req.getTemperature() != null)        bot.setTemperature(req.getTemperature());
        if (req.getMaxTokens() != null)          bot.setMaxTokens(req.getMaxTokens());
        if (req.getSystemPrompt() != null)       bot.setSystemPrompt(req.getSystemPrompt());
        if (req.getTone() != null)               bot.setTone(req.getTone());
        if (req.getLanguage() != null)           bot.setLanguage(req.getLanguage());
        if (req.getRagEnabled() != null)         bot.setRagEnabled(req.getRagEnabled());
        if (req.getLeadCaptureEnabled() != null) bot.setLeadCaptureEnabled(req.getLeadCaptureEnabled());
        if (req.getLiveChatEnabled() != null)    bot.setLiveChatEnabled(req.getLiveChatEnabled());
        if (req.getWidgetConfig() != null)       bot.setWidgetConfig(req.getWidgetConfig());

        return botRepo.save(bot);
    }

    @Transactional
    public Bot publishBot(UUID botId, UUID tenantId) {
        Bot bot = getBotOrThrow(botId, tenantId);
        if (bot.getSystemPrompt() == null || bot.getSystemPrompt().isBlank()) {
            throw new BusinessException("MISSING_SYSTEM_PROMPT",
                    "Bot must have a system prompt before publishing");
        }
        bot.setStatus("active");
        return botRepo.save(bot);
    }

    @Transactional
    public void deleteBot(UUID botId, UUID tenantId) {
        Bot bot = getBotOrThrow(botId, tenantId);
        bot.setStatus("archived");
        botRepo.save(bot);
        log.info("Archived bot {} for tenant {}", botId, tenantId);
    }

    /**
     * Returns a bot by embed token (used by the public chat widget — no auth).
     */
    public Bot getBotByEmbedToken(String embedToken) {
        return botRepo.findByEmbedToken(embedToken)
                .filter(b -> "active".equals(b.getStatus()))
                .orElseThrow(() -> new ResourceNotFoundException("Bot not found or inactive"));
    }
}
