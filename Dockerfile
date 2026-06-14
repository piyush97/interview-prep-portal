# Build stage
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-healthcheck /usr/local/bin/docker-healthcheck
RUN chmod +x /usr/local/bin/docker-healthcheck && apk add --no-cache curl

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fs http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
