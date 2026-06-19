package com.chatplatform.ai.service;

import com.chatplatform.ai.dto.RelevantChunk;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Points.*;
import io.qdrant.client.grpc.Points.Filter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Retrieves relevant document chunks from Qdrant for RAG.
 *
 * Flow:
 *  1. Embed the user's question using Ollama nomic-embed-text
 *  2. Search the tenant's Qdrant collection
 *  3. Filter by the specific KB IDs linked to the bot
 *  4. Return top-K chunks above the score threshold
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RagService {

    private final QdrantClient qdrant;
    private final EmbeddingModel embeddingModel;  // Spring AI — Ollama nomic-embed-text

    @Value("${app.rag.top-k:5}")
    private int topK;

    @Value("${app.rag.score-threshold:0.65}")
    private float scoreThreshold;

    /**
     * Retrieves the most relevant document chunks for the given query.
     *
     * @param tenantId  used as the Qdrant collection name: kb_{tenantId}
     * @param kbIds     only search within these knowledge bases
     * @param query     the user's message to find relevant context for
     */
    public List<RelevantChunk> retrieve(UUID tenantId, List<UUID> kbIds, String query) {
        if (kbIds == null || kbIds.isEmpty()) {
            return List.of();
        }

        String collectionName = "kb_" + tenantId.toString().replace("-", "");

        try {
            // Step 1: Embed the query
            float[] queryVector = embeddingModel.embed(query);

            // Step 2: Build Qdrant filter (only search KBs linked to this bot)
            Filter filter = buildKbFilter(kbIds);

            // Step 3: Search Qdrant
            List<ScoredPoint> results = qdrant.searchAsync(
                SearchPoints.newBuilder()
                    .setCollectionName(collectionName)
                    .addAllVector(toFloatList(queryVector))
                    .setFilter(filter)
                    .setLimit(topK)
                    .setScoreThreshold(scoreThreshold)
                    .setWithPayload(WithPayloadSelector.newBuilder().setEnable(true).build())
                    .build()
            ).get().getResultList();

            // Step 4: Map results to our DTO
            return results.stream()
                    .map(this::toChunk)
                    .toList();

        } catch (Exception e) {
            // RAG failure should not break the chat — just log and continue without context
            log.warn("RAG retrieval failed for tenant {}: {}", tenantId, e.getMessage());
            return List.of();
        }
    }

    // ── Private helpers ──────────────────────────────────────────

    private Filter buildKbFilter(List<UUID> kbIds) {
        // Match any of the given kb_id values in the payload
        Match match = Match.newBuilder()
                .addAllKeywords(kbIds.stream().map(UUID::toString).toList())
                .build();

        FieldCondition condition = FieldCondition.newBuilder()
                .setKey("kb_id")
                .setMatch(match)
                .build();

        return Filter.newBuilder()
                .addMust(Condition.newBuilder().setField(condition).build())
                .build();
    }

    private RelevantChunk toChunk(ScoredPoint point) {
        Map<String, io.qdrant.client.grpc.JsonWithInt.Value> payload = point.getPayloadMap();

        return RelevantChunk.builder()
                .docId(getStr(payload, "doc_id"))
                .kbId(getStr(payload, "kb_id"))
                .chunkIndex((int) getLong(payload, "chunk_index"))
                .text(getStr(payload, "text"))
                .score(point.getScore())
                .sourceUrl(getStr(payload, "source_url"))
                .build();
    }

    private List<Float> toFloatList(float[] arr) {
        List<Float> list = new ArrayList<>(arr.length);
        for (float f : arr) list.add(f);
        return list;
    }

    private String getStr(Map<String, io.qdrant.client.grpc.JsonWithInt.Value> payload, String key) {
        var val = payload.get(key);
        return (val != null) ? val.getStringValue() : "";
    }

    private long getLong(Map<String, io.qdrant.client.grpc.JsonWithInt.Value> payload, String key) {
        var val = payload.get(key);
        return (val != null) ? val.getIntegerValue() : 0;
    }
}
