package com.chatplatform.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Thin wrapper around Ollama's REST API.
 * Replaces Spring AI's ChatModel + EmbeddingModel.
 */
@Slf4j
@Service
public class OllamaClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.ollama.base-url:http://ollama:11434}")
    private String baseUrl;

    @Value("${app.ollama.embedding-model:nomic-embed-text}")
    private String embeddingModel;

    /** Call Ollama /api/chat and return the assistant's reply text. */
    public String chat(String model, double temperature, int maxTokens,
                       List<Map<String, String>> messages) {
        Map<String, Object> body = Map.of(
            "model",    model,
            "messages", messages,
            "stream",   false,
            "options",  Map.of(
                "temperature",  temperature,
                "num_predict",  maxTokens
            )
        );

        try {
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                baseUrl + "/api/chat",
                HttpMethod.POST,
                new HttpEntity<>(body, jsonHeaders()),
                new ParameterizedTypeReference<>() {}
            );
            Map<String, Object> respBody = resp.getBody();
            if (respBody != null && respBody.get("message") instanceof Map<?, ?> msg) {
                return (String) msg.get("content");
            }
        } catch (Exception e) {
            log.error("Ollama chat call failed: {}", e.getMessage());
        }
        return "";
    }

    /** Call Ollama /api/embeddings and return the float vector. */
    public float[] embed(String text) {
        Map<String, Object> body = Map.of(
            "model",  embeddingModel,
            "prompt", text
        );

        try {
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                baseUrl + "/api/embeddings",
                HttpMethod.POST,
                new HttpEntity<>(body, jsonHeaders()),
                new ParameterizedTypeReference<>() {}
            );
            Map<String, Object> respBody = resp.getBody();
            if (respBody != null && respBody.get("embedding") instanceof List<?> raw) {
                float[] arr = new float[raw.size()];
                for (int i = 0; i < raw.size(); i++) {
                    arr[i] = ((Number) raw.get(i)).floatValue();
                }
                return arr;
            }
        } catch (Exception e) {
            log.error("Ollama embed call failed: {}", e.getMessage());
        }
        return new float[0];
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }
}
