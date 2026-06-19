package com.chatplatform.kb.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class OllamaEmbeddingClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.ollama.base-url:http://ollama:11434}")
    private String baseUrl;

    @Value("${app.ollama.embedding-model:nomic-embed-text}")
    private String model;

    public float[] embed(String text) {
        Map<String, Object> body = Map.of("model", model, "prompt", text);
        try {
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                baseUrl + "/api/embeddings",
                HttpMethod.POST,
                new HttpEntity<>(body, jsonHeaders()),
                new ParameterizedTypeReference<>() {}
            );
            Map<String, Object> rb = resp.getBody();
            if (rb != null && rb.get("embedding") instanceof List<?> raw) {
                float[] arr = new float[raw.size()];
                for (int i = 0; i < raw.size(); i++) arr[i] = ((Number) raw.get(i)).floatValue();
                return arr;
            }
        } catch (Exception e) {
            log.error("Ollama embedding failed: {}", e.getMessage());
        }
        return new float[0];
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }
}
