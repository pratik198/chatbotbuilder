# Build context is the project root (set in docker-compose.yml).

# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /build

# widget.js is pre-built on host (widget/ has no internet in Docker build).
# Copy the already-built artifact directly.
COPY frontend/public/widget.js ./frontend/public/widget.js

# Frontend: install deps then build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --no-audit --no-fund

COPY frontend ./frontend
# widget.js is already in frontend/public/ from the COPY above
RUN cd frontend && npm run build
# Output: /build/frontend/dist

# ── Stage 2: Serve ────────────────────────────────────────────────
FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /build/frontend/dist /usr/share/nginx/html

# SPA config: serve static files, fall back to index.html
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location ~* \\.(js|css|png|jpg|gif|ico|svg|woff2?)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/app.conf

EXPOSE 80
