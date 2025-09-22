# Multi-stage Dockerfile for optimized builds
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY functions/package*.json ./functions/

# Install dependencies with optimizations
RUN npm ci --prefer-offline --no-audit --ignore-scripts && \
    cd functions && npm ci --prefer-offline --no-audit --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/functions/node_modules ./functions/node_modules

# Copy source code
COPY . .

# Build the application
RUN npm run build:ci

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/functions/lib ./functions/lib
COPY --from=builder /app/functions/node_modules ./functions/node_modules

# Copy necessary config files
COPY firebase.json ./
COPY firestore.rules ./
COPY firestore.indexes.json ./
COPY storage.rules ./

EXPOSE 3000

CMD ["npm", "run", "preview"]