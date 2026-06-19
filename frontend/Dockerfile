# Build context is the project root (set in docker-compose.yml).
# This lets us access both widget/ and frontend/ in one build.

# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /build

# Widget: install deps then build
# vite.config.js outputs to ../frontend/public/widget.js
COPY widget/package*.json ./widget/
RUN cd widget && npm ci --silent

COPY widget ./widget
RUN mkdir -p frontend/public && cd widget && npm run build
# Output: /build/frontend/public/widget.js

# Frontend: install deps then build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --silent

COPY frontend ./frontend
# widget.js already at frontend/public/widget.js from the step above
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
