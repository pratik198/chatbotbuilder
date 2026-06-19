package com.chatplatform.ai.dto;

import lombok.Builder;
import lombok.Data;

/**
 * A document chunk retrieved from Qdrant that was used to augment the prompt.
 */
@Data
@Builder
public class RelevantChunk {

    private String docId;
    private String kbId;
    private int chunkIndex;
    private String text;
    private float score;        // similarity score 0-1
    private String sourceUrl;   // original URL or file name
}
