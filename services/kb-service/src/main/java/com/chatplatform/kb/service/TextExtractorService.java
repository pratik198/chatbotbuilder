package com.chatplatform.kb.service;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;

/**
 * Extracts plain text from different source types:
 * - PDF files (via Apache PDFBox)
 * - DOCX files (via Apache POI)
 * - URLs (via Jsoup HTTP scraping)
 * - Raw text (passed directly)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TextExtractorService {

    private final MinioClient minioClient;

    @Value("${app.minio.bucket}")
    private String bucket;

    /**
     * Extract raw text from the given source.
     *
     * @param sourceType  "pdf" | "docx" | "url" | "text"
     * @param sourceUrl   MinIO object path (for files) or HTTP URL (for url type)
     * @param rawText     used when sourceType="text"
     */
    public String extract(String sourceType, String sourceUrl, String rawText) {
        return switch (sourceType.toLowerCase()) {
            case "pdf"  -> extractFromMinioFile(sourceUrl, "pdf");
            case "docx" -> extractFromMinioFile(sourceUrl, "docx");
            case "url"  -> extractFromUrl(sourceUrl);
            case "text" -> rawText != null ? rawText : "";
            default     -> throw new IllegalArgumentException("Unknown source type: " + sourceType);
        };
    }

    // ── Private ──────────────────────────────────────────────────

    private String extractFromMinioFile(String objectPath, String type) {
        try (InputStream stream = minioClient.getObject(
                GetObjectArgs.builder().bucket(bucket).object(objectPath).build())) {
            if ("pdf".equals(type)) {
                return extractPdf(stream);
            } else {
                return extractDocx(stream);
            }
        } catch (Exception e) {
            log.error("Failed to extract text from MinIO object {}: {}", objectPath, e.getMessage());
            throw new RuntimeException("Text extraction failed: " + e.getMessage(), e);
        }
    }

    private String extractPdf(InputStream stream) throws Exception {
        try (PDDocument doc = Loader.loadPDF(stream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            return cleanText(text);
        }
    }

    private String extractDocx(InputStream stream) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(stream)) {
            StringBuilder sb = new StringBuilder();
            doc.getParagraphs().forEach(p -> {
                if (!p.getText().isBlank()) {
                    sb.append(p.getText()).append("\n");
                }
            });
            return cleanText(sb.toString());
        }
    }

    private String extractFromUrl(String url) {
        try {
            org.jsoup.nodes.Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 ChatPlatform-Crawler/1.0")
                    .timeout(15_000)
                    .get();

            // Remove boilerplate (nav, header, footer, scripts)
            doc.select("nav, header, footer, script, style, iframe, noscript").remove();

            // Try to find main content block
            Element main = doc.selectFirst("main, article, [role=main], .content, #content");
            String text = (main != null) ? main.text() : doc.body().text();

            return cleanText(text);
        } catch (Exception e) {
            log.error("Failed to scrape URL {}: {}", url, e.getMessage());
            throw new RuntimeException("URL scraping failed: " + e.getMessage(), e);
        }
    }

    private String cleanText(String text) {
        if (text == null) return "";
        return text
                .replaceAll("\r\n", "\n")
                .replaceAll("\r", "\n")
                .replaceAll("\n{3,}", "\n\n")  // collapse 3+ blank lines to 2
                .replaceAll("[ \t]{2,}", " ")  // collapse spaces/tabs
                .trim();
    }
}
