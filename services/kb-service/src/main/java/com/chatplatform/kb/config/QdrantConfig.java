package com.chatplatform.kb.config;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QdrantConfig {

    @Value("${app.qdrant.host:localhost}")
    private String qdrantHost;

    @Value("${app.qdrant.port:6334}")
    private int qdrantPort;

    @Value("${app.qdrant.use-tls:false}")
    private boolean qdrantTls;

    @Value("${app.minio.endpoint}")
    private String minioEndpoint;

    @Value("${app.minio.access-key}")
    private String minioAccessKey;

    @Value("${app.minio.secret-key}")
    private String minioSecretKey;

    @Bean
    public QdrantClient qdrantClient() {
        return new QdrantClient(
            QdrantGrpcClient.newBuilder(qdrantHost, qdrantPort, qdrantTls).build()
        );
    }

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(minioEndpoint)
                .credentials(minioAccessKey, minioSecretKey)
                .build();
    }
}
