# Multi-stage Dockerfile for Dearly Full-Stack Application
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation on alpine if needed
RUN apk add --no-cache python3 make g++ sqlite

ENV NODE_ENV=production
ENV PORT=5000

# Install Server Dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server code
COPY server/ ./

# Copy built frontend assets from stage 1 into client/dist for unified serving
COPY --from=client-builder /app/client/dist /app/client/dist

# Create persistent storage directories
RUN mkdir -p /app/server/data /app/server/uploads && \
    addgroup -g 1001 -S nodejs && \
    adduser -S dearly -u 1001 && \
    chown -R dearly:nodejs /app/server/data /app/server/uploads

USER dearly

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "src/index.js"]
