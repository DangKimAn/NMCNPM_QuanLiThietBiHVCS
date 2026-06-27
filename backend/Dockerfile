# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Build the application
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./

# Copy node_modules (including Prisma client) directly from builder to avoid re-downloading
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema
COPY prisma ./prisma/

# Copy built files
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
