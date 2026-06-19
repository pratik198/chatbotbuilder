package com.chatplatform.ai.service;

import com.chatplatform.ai.dto.AiRequest;
import com.chatplatform.ai.dto.AiResponse;
import com.chatplatform.ai.dto.RelevantChunk;
import com.chatplatform.ai.repository.BotKnowledgeBaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final OllamaClient ollamaClient;
    private final RagService ragService;
    private final PromptBuilder promptBuilder;
    private final BotKnowledgeBaseRepository botKbRepo;

    public AiResponse chat(AiRequest req) {
        long start = System.currentTimeMillis();

        List<RelevantChunk> chunks = retrieveContext(req);
        List<Map<String, String>> messages = promptBuilder.build(req, chunks);

        String modelName = resolveModel(req);
        double temperature = req.getTemperature() != null ? req.getTemperature() : 0.7;
        int maxTokens = req.getMaxTokens() != null ? req.getMaxTokens() : 2048;

        String content = ollamaClient.chat(modelName, temperature, maxTokens, messages);

        int latencyMs = (int) (System.currentTimeMillis() - start);
        log.debug("LLM call completed: model={} latency={}ms", modelName, latencyMs);

        return AiResponse.builder()
                .content(content)
                .modelUsed(modelName)
                .latencyMs(latencyMs)
                .sources(chunks.isEmpty() ? null : chunks)
                .build();
    }

    private List<RelevantChunk> retrieveContext(AiRequest req) {
        if (!req.isRagEnabled() || req.getUserMessage() == null) return List.of();

        List<UUID> kbIds = req.getKnowledgeBaseIds();
        if (kbIds == null || kbIds.isEmpty()) {
            kbIds = botKbRepo.findKbIdsByBotId(req.getBotId());
        }
        if (kbIds.isEmpty()) return List.of();

        return ragService.retrieve(req.getTenantId(), kbIds, req.getUserMessage());
    }

    private String resolveModel(AiRequest req) {
        return (req.getModelName() != null && !req.getModelName().isBlank())
                ? req.getModelName() : "deepseek-v3";
    }
}
