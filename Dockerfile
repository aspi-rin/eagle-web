# ─── Stage 1: build frontend ──────────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: production runtime ─────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "index.js"]
