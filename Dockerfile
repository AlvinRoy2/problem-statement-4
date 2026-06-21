# Stage 1: Build the React frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

# Accept frontend environment variables during build
ARG VITE_GOOGLE_ANALYTICS_ID

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Node.js backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Stage 3: Production image
FROM node:22-alpine
WORKDIR /app/backend

# Copy backend package.json and install only production dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy compiled backend from Stage 2
COPY --from=backend-builder /app/backend/dist ./dist

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose the backend port
EXPOSE 4000

# Start the Node.js server
CMD ["node", "dist/server.js"]
