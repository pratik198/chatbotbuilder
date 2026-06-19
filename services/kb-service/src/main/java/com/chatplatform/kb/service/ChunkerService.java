package com.chatplatform.kb.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Splits a long text into overlapping chunks for embedding.
 *
 * Strategy: paragraph-aware sliding window.
 * 1. Split on double-newlines (natural paragraph boundaries)
 * 2. Accumulate paragraphs until a chunk reaches chunkSize
 * 3. Start the next chunk with the last `overlap` characters from the previous chunk
 *    so that context flows across chunk boundaries (important for RAG)
 */
@Service
public class ChunkerService {

    @Value("${app.kb.chunk-size:800}")
    private int chunkSize;

    @Value("${app.kb.chunk-overlap:80}")
    private int chunkOverlap;

    /**
     * Returns a list of text chunks, each ≤ chunkSize characters with overlap.
     */
    public List<String> chunk(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }

        List<String> chunks = new ArrayList<>();
        String[] paragraphs = text.split("\n\n+");

        StringBuilder current = new StringBuilder();

        for (String para : paragraphs) {
            String p = para.trim();
            if (p.isEmpty()) continue;

            // If adding this paragraph would exceed chunkSize, flush current chunk
            if (current.length() > 0 && current.length() + p.length() + 2 > chunkSize) {
                chunks.add(current.toString().trim());
                // Start next chunk with overlap from the end of the current chunk
                String overlap = getOverlap(current.toString());
                current = new StringBuilder(overlap);
                if (!overlap.isEmpty()) {
                    current.append("\n\n");
                }
            }

            // Handle paragraphs that are longer than chunkSize by themselves
            if (p.length() > chunkSize) {
                // Flush any accumulated content first
                if (current.length() > 0) {
                    chunks.add(current.toString().trim());
                    current = new StringBuilder();
                }
                // Split the long paragraph by character window
                chunks.addAll(splitLongParagraph(p));
                continue;
            }

            if (current.length() > 0) {
                current.append("\n\n");
            }
            current.append(p);
        }

        if (!current.toString().isBlank()) {
            chunks.add(current.toString().trim());
        }

        return chunks;
    }

    // ── Private ──────────────────────────────────────────────────

    private String getOverlap(String text) {
        if (text.length() <= chunkOverlap) return text;
        String tail = text.substring(text.length() - chunkOverlap);
        // Try to start overlap at a sentence boundary
        int dot = tail.indexOf(". ");
        if (dot >= 0 && dot < tail.length() - 1) {
            return tail.substring(dot + 2);
        }
        return tail;
    }

    private List<String> splitLongParagraph(String text) {
        List<String> result = new ArrayList<>();
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + chunkSize, text.length());
            result.add(text.substring(start, end));
            start += chunkSize - chunkOverlap;
        }
        return result;
    }
}
