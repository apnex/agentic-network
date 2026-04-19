FROM node:22-slim

WORKDIR /app

# Copy the shared OIS packages (Phase 2a: cognitive-layer added for
# LLM-usage → CognitiveTelemetry bridge in sandwich.ts / director-chat.ts).
COPY ois-network-adapter-2.0.0.tgz ./
COPY ois-cognitive-layer-0.1.0.tgz ./

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production=false

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Cloud Run sets PORT automatically
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/index.js"]
