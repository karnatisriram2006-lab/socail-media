# ──────────────────────────────────────────
# Frontend Dockerfile (multi-stage build)
# ──────────────────────────────────────────

# ---- Build Stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production Stage ----
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config for SPA (handle client-side routing)
RUN echo 'server { \
    listen 4173; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /assets/ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 4173

CMD ["nginx", "-g", "daemon off;"]