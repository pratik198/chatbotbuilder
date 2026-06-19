package com.chatplatform.ai.service;

import com.chatplatform.ai.dto.AiRequest;
import com.chatplatform.ai.dto.RelevantChunk;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class PromptBuilder {

    public List<Map<String, String>> build(AiRequest request, List<RelevantChunk> chunks) {
        List<Map<String, String>> messages = new ArrayList<>();

        messages.add(Map.of("role", "system", "content", buildSystemPrompt(request, chunks)));

        if (request.getHistory() != null) {
            for (AiRequest.HistoryMessage h : request.getHistory()) {
                if ("user".equals(h.getRole()) || "assistant".equals(h.getRole())) {
                    messages.add(Map.of("role", h.getRole(), "content", h.getContent()));
                }
            }
        }

        messages.add(Map.of("role", "user", "content", request.getUserMessage()));
        return messages;
    }

    private String buildSystemPrompt(AiRequest request, List<RelevantChunk> chunks) {
        StringBuilder sb = new StringBuilder();

        String base = (request.getSystemPrompt() != null && !request.getSystemPrompt().isBlank())
                ? request.getSystemPrompt()
                : "You are a helpful AI assistant.";

        sb.append(base).append("\n\n");
        sb.append("""
                Rules:
                - Be concise and helpful.
                - If you don't know something, say so honestly.
                - Do not make up facts or URLs.
                - Respond in the same language the user writes in.
                """);

        if (Boolean.TRUE.equals(request.getLeadCaptureEnabled())) {
            sb.append("""

                    - After 1-2 exchanges, if the user hasn't shared their email address yet, \
                    politely ask for their name and email so you can follow up with more details.
                    """);
        }

        if (!chunks.isEmpty()) {
            sb.append("\n\nUse the following information to answer the user's question:\n---\n");
            for (RelevantChunk chunk : chunks) {
                sb.append(chunk.getText()).append("\n\n");
            }
            sb.append("---\nOnly use the information above if it's relevant. ");
            sb.append("If the answer is not in the context, say you don't have that information.\n");
        }

        return sb.toString();
    }
}
