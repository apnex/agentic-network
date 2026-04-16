FROM node:22-slim

WORKDIR /app

# Copy the shared hub-connection package
COPY ois-hub-connection-1.3.0.tgz ./

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
