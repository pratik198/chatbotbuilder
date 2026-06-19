# Pre-built on host (Docker build has no internet access on this machine).
# To rebuild: run `npm run build` in widget/ and frontend/ then rebuild image.

FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf

# Copy pre-built frontend dist
COPY frontend/dist /usr/share/nginx/html

# Copy pre-built widget.js into the static folder so /widget.js works
COPY frontend/public/widget.js /usr/share/nginx/html/widget.js

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
