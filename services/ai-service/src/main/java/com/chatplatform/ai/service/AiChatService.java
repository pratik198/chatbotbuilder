package com.chatplatform.ai.service;

import com.chatplatform.ai.dto.AiRequest;
import com.chatplatform.ai.dto.AiResponse;
import com.chatplatform.ai.dto.RelevantChunk;
import com.chatplatform.ai.repository.BotKnowledgeBaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Main orchestrator for the AI chat flow.
 *
 * Steps:
 *  1. If RAG enabled — retrieve relevant chunks from Qdrant
 *  2. Build the message list (system + history + user message)
 *  3. Call Ollama with the correct model + temperature
 *  4. Return the response with usage stats
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final ChatModel chatModel;                    // Spring AI — Ollama chat model
    private final RagService ragService;
    private final PromptBuilder promptBuilder;
    private final BotKnowledgeBaseRepository botKbRepo;

    public AiResponse chat(AiRequest req) {
        long start = System.currentTimeMillis();

        // Step 1: RAG retrieval
        List<RelevantChunk> chunks = retrieveContext(req);

        // Step 2: Build message list
        List<Message> messages = promptBuilder.build(req, chunks);

        // Step 3: Call Ollama
        String modelName = resolveModel(req);
        double temperature = req.getTemperature() != null ? req.getTemperature() : 0.7;

        OllamaOptions options = OllamaOptions.builder()
                .model(modelName)
                .temperature(temperature)
                .numPredict(req.getMaxTokens() != null ? req.getMaxTokens() : 2048)
                .build();

        Prompt prompt = new Prompt(messages, options);

        org.springframework.ai.chat.model.ChatResponse response = chatModel.call(prompt);

        String content = response.getResult().getOutput().getText();

        // Step 4: Extract usage metadata (Ollama provides this)
        Integer promptTokens = null;
        Integer completionTokens = null;
        try {
            var usage = response.getMetadata().getUsage();
            if (usage != null) {
                promptTokens = usage.getPromptTokens() != null ? usage.getPromptTokens().intValue() : null;
                completionTokens = usage.getCompletionTokens() != null ? usage.getCompletionTokens().intValue() : null;
            }
        } catch (Exception e) {
            // metadata not always available — non-fatal
        }

        int latencyMs = (int) (System.currentTimeMillis() - start);
        log.debug("LLM call completed: model={} latency={}ms tokens={}/{}",
                  modelName, latencyMs, promptTokens, completionTokens);

        return AiResponse.builder()
                .content(content)
                .modelUsed(modelName)
                .promptTokens(promptTokens)
                .completionTokens(completionTokens)
                .latencyMs(latencyMs)
                .sources(chunks.isEmpty() ? null : chunks)
                .build();
    }

    // ── Private ──────────────────────────────────────────────────

    private List<RelevantChunk> retrieveContext(AiRequest req) {
        if (!req.isRagEnabled() || req.getUserMessage() == null) {
            return List.of();
        }

        // Use KB IDs from the request, or fall back to querying DB
        List<UUID> kbIds = req.getKnowledgeBaseIds();
        if (kbIds == null || kbIds.isEmpty()) {
            kbIds = botKbRepo.findKbIdsByBotId(req.getBotId());
        }

        if (kbIds.isEmpty()) {
            return List.of();
        }

        return ragService.retrieve(req.getTenantId(), kbIds, req.getUserMessage());
    }

    private String resolveModel(AiRequest req) {
        if (req.getModelName() != null && !req.getModelName().isBlank()) {
            return req.getModelName();
        }
        // Sensible default — the model must be pulled in Ollama
        return "deepseek-v3";
    }
}
