package com.chatplatform.ai.config;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QdrantConfig {

    @Value("${app.qdrant.host:localhost}")
    private String host;

    @Value("${app.qdrant.port:6334}")
    private int port;

    @Value("${app.qdrant.use-tls:false}")
    private boolean useTls;

    @Bean
    public QdrantClient qdrantClient() {
        return new QdrantClient(
            QdrantGrpcClient.newBuilder(host, port, useTls).build()
        );
    }
}
