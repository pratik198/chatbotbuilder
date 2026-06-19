package com.chatplatform.kb.service;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Collections.*;
import io.qdrant.client.grpc.Points.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

/**
 * Manages Qdrant collections and upserts embedded chunks.
 *
 * Each tenant has one collection: kb_{tenantId_no_dashes}
 * Each chunk is stored as a Qdrant point with payload:
 *   { doc_id, kb_id, chunk_index, text, source_url }
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VectorStoreService {

    private final QdrantClient qdrant;
    private final OllamaEmbeddingClient embeddingClient;

    @Value("${app.kb.vector-dimension:768}")
    private int vectorDimension;

    /**
     * Embed all chunks and upsert them into Qdrant.
     * Creates the collection if it doesn't exist yet.
     *
     * @param tenantId      determines collection name
     * @param kbId          stored in payload for RAG filtering
     * @param docId         stored in payload for deletion
     * @param sourceUrl     stored in payload for source citation
     * @param chunks        text chunks to embed and store
     */
    public int upsertChunks(UUID tenantId, UUID kbId, UUID docId,
                             String sourceUrl, List<String> chunks) {
        if (chunks.isEmpty()) return 0;

        String collectionName = collectionName(tenantId);
        ensureCollectionExists(collectionName);

        List<PointStruct> points = new ArrayList<>();

        for (int i = 0; i < chunks.size(); i++) {
            String text = chunks.get(i);
            float[] vector = embeddingClient.embed(text);

            PointStruct point = PointStruct.newBuilder()
                    .setId(id(UUID.randomUUID()))
                    .setVectors(vectors(toFloatList(vector)))
                    .putAllPayload(Map.of(
                        "doc_id",      value(docId.toString()),
                        "kb_id",       value(kbId.toString()),
                        "chunk_index", value((long) i),
                        "text",        value(text),
                        "source_url",  value(sourceUrl != null ? sourceUrl : "")
                    ))
                    .build();

            points.add(point);
        }

        try {
            qdrant.upsertAsync(collectionName,
                    points, true  // wait=true: block until indexed
            ).get();
            log.info("Upserted {} chunks for doc {} into collection {}", chunks.size(), docId, collectionName);
        } catch (Exception e) {
            log.error("Failed to upsert chunks into Qdrant: {}", e.getMessage());
            throw new RuntimeException("Vector store upsert failed", e);
        }

        return chunks.size();
    }

    /**
     * Delete all vectors for a document (called when document is deleted).
     */
    public void deleteByDocId(UUID tenantId, UUID docId) {
        String collectionName = collectionName(tenantId);

        try {
            Filter filter = Filter.newBuilder()
                    .addMust(Condition.newBuilder()
                        .setField(FieldCondition.newBuilder()
                            .setKey("doc_id")
                            .setMatch(Match.newBuilder().setKeyword(docId.toString()))
                            .build())
                        .build())
                    .build();

            qdrant.deleteAsync(collectionName,
                    PointsSelector.newBuilder().setFilter(filter).build(),
                    true).get();

            log.info("Deleted vectors for doc {} from {}", docId, collectionName);
        } catch (Exception e) {
            log.warn("Failed to delete vectors for doc {}: {}", docId, e.getMessage());
        }
    }

    // ── Private ──────────────────────────────────────────────────

    private void ensureCollectionExists(String collectionName) {
        try {
            boolean exists = qdrant.collectionExistsAsync(collectionName).get();
            if (!exists) {
                qdrant.createCollectionAsync(collectionName,
                        VectorParams.newBuilder()
                                .setSize(vectorDimension)
                                .setDistance(Distance.Cosine)
                                .build()
                ).get();
                log.info("Created Qdrant collection: {}", collectionName);
            }
        } catch (Exception e) {
            log.error("Failed to ensure Qdrant collection {}: {}", collectionName, e.getMessage());
            throw new RuntimeException("Collection setup failed", e);
        }
    }

    private String collectionName(UUID tenantId) {
        return "kb_" + tenantId.toString().replace("-", "");
    }

    private List<Float> toFloatList(float[] arr) {
        List<Float> list = new ArrayList<>(arr.length);
        for (float f : arr) list.add(f);
        return list;
    }
}
