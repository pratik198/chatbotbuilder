package com.chatplatform.ai.service;

import com.chatplatform.ai.dto.RelevantChunk;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.JsonWithInt;
import io.qdrant.client.grpc.Points.*;
import io.qdrant.client.grpc.Points.Filter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagService {

    private final QdrantClient qdrant;
    private final OllamaClient ollamaClient;

    @Value("${app.rag.top-k:5}")
    private int topK;

    @Value("${app.rag.score-threshold:0.65}")
    private float scoreThreshold;

    public List<RelevantChunk> retrieve(UUID tenantId, List<UUID> kbIds, String query) {
        if (kbIds == null || kbIds.isEmpty()) return List.of();

        String collectionName = "kb_" + tenantId.toString().replace("-", "");

        try {
            float[] queryVector = ollamaClient.embed(query);
            if (queryVector.length == 0) return List.of();

            Filter filter = buildKbFilter(kbIds);

            List<ScoredPoint> results = qdrant.searchAsync(
                SearchPoints.newBuilder()
                    .setCollectionName(collectionName)
                    .addAllVector(toFloatList(queryVector))
                    .setFilter(filter)
                    .setLimit(topK)
                    .setScoreThreshold(scoreThreshold)
                    .setWithPayload(WithPayloadSelector.newBuilder().setEnable(true).build())
                    .build()
            ).get();

            return results.stream().map(this::toChunk).toList();

        } catch (Exception e) {
            log.warn("RAG retrieval failed for tenant {}: {}", tenantId, e.getMessage());
            return List.of();
        }
    }

    private Filter buildKbFilter(List<UUID> kbIds) {
        Match match = Match.newBuilder()
                .addAllKeywords(kbIds.stream().map(UUID::toString).toList())
                .build();
        FieldCondition condition = FieldCondition.newBuilder()
                .setKey("kb_id").setMatch(match).build();
        return Filter.newBuilder()
                .addMust(Condition.newBuilder().setField(condition).build())
                .build();
    }

    private RelevantChunk toChunk(ScoredPoint point) {
        Map<String, JsonWithInt.Value> payload = point.getPayloadMap();
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

    private String getStr(Map<String, JsonWithInt.Value> payload, String key) {
        JsonWithInt.Value val = payload.get(key);
        return val != null ? val.getStringValue() : "";
    }

    private long getLong(Map<String, JsonWithInt.Value> payload, String key) {
        JsonWithInt.Value val = payload.get(key);
        return val != null ? val.getIntegerValue() : 0;
    }
}
