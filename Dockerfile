# ── Stage 1: Build React app ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY index.html vite.config.js ./
COPY src ./src

# Build the React app into /app/dist
RUN npm run build


# ── Stage 2: Python Flask proxy ───────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Flask server
COPY server.py .

# Copy built React app from Stage 1
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5050

# Environment defaults (override with docker run -e or docker-compose)
ENV BACKEND_URL=https://localhost:8883
ENV VERIFY_SSL=false
ENV PORT=5050

CMD ["python", "server.py"]
