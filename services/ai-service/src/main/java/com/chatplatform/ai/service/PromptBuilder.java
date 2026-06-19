package com.chatplatform.ai.service;

import com.chatplatform.ai.dto.AiRequest;
import com.chatplatform.ai.dto.RelevantChunk;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Assembles the full list of messages sent to the LLM.
 *
 * Order:
 *  [0] SystemMessage  — bot personality + rules + RAG context
 *  [1] UserMessage    — first message from history
 *  [2] AssistantMessage — first reply from history
 *  ...
 *  [N] UserMessage    — current user message (the one to respond to)
 */
@Component
public class PromptBuilder {

    /**
     * Builds the message list for the LLM call.
     *
     * @param request the chat request
     * @param chunks  retrieved RAG chunks (may be empty)
     * @return ordered list of Spring AI Message objects
     */
    public List<Message> build(AiRequest request, List<RelevantChunk> chunks) {
        List<Message> messages = new ArrayList<>();

        // 1. System message (personality + RAG context)
        messages.add(new SystemMessage(buildSystemPrompt(request, chunks)));

        // 2. Conversation history (alternating user/assistant)
        if (request.getHistory() != null) {
            for (AiRequest.HistoryMessage h : request.getHistory()) {
                if ("user".equals(h.getRole())) {
                    messages.add(new UserMessage(h.getContent()));
                } else if ("assistant".equals(h.getRole())) {
                    messages.add(new AssistantMessage(h.getContent()));
                }
            }
        }

        // 3. Current user message
        messages.add(new UserMessage(request.getUserMessage()));

        return messages;
    }

    // ── Private ──────────────────────────────────────────────────

    private String buildSystemPrompt(AiRequest request, List<RelevantChunk> chunks) {
        StringBuilder sb = new StringBuilder();

        // Bot's custom system prompt (or a sensible default)
        String base = (request.getSystemPrompt() != null && !request.getSystemPrompt().isBlank())
                ? request.getSystemPrompt()
                : "You are a helpful AI assistant.";

        sb.append(base).append("\n\n");

        // Always-on rules
        sb.append("""
                Rules:
                - Be concise and helpful.
                - If you don't know something, say so honestly.
                - Do not make up facts or URLs.
                - Respond in the same language the user writes in.
                """);

        // Lead capture instruction — injected when bot has lead capture enabled
        if (Boolean.TRUE.equals(request.getLeadCaptureEnabled())) {
            sb.append("""

                    - After 1-2 exchanges, if the user hasn't shared their email address yet, \
                    politely ask for their name and email so you can follow up with more details.
                    """);
        }

        // RAG context — only included if chunks were found
        if (!chunks.isEmpty()) {
            sb.append("\n\nUse the following information to answer the user's question:\n");
            sb.append("---\n");
            for (RelevantChunk chunk : chunks) {
                sb.append(chunk.getText()).append("\n\n");
            }
            sb.append("---\n");
            sb.append("Only use the information above if it's relevant to the question. ");
            sb.append("If the answer is not in the context, say you don't have that information.\n");
        }

        return sb.toString();
    }
}
