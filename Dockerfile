# Stage 1: Build the frontend Angular app
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Angular app sources
COPY client/ ./client/
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY drizzle.config.ts ./
COPY shared/ ./shared/

# Build the frontend app
RUN npm run build

# Stage 2: Build the .NET Core WebAPI
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS backend-builder

WORKDIR /app

# Copy Backend project files
COPY Backend/FurnitureDelivery.API/ ./Backend/FurnitureDelivery.API/

# Restore and build the project
WORKDIR /app/Backend/FurnitureDelivery.API
RUN dotnet restore
RUN dotnet publish -c Release -o out

# Stage 3: Final image with Node.js runtime for the Express server
FROM node:20-alpine

WORKDIR /app

# Install necessary system dependencies
RUN apk add --no-cache curl netcat-openbsd

# Copy the built frontend
COPY --from=frontend-builder /app/dist ./dist

# Copy server files
COPY server/ ./server/
COPY shared/ ./shared/
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the .NET Core WebAPI
COPY --from=backend-builder /app/Backend/FurnitureDelivery.API/out ./Backend/FurnitureDelivery.API/out

# Add Docker entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose the ports
EXPOSE 5000
EXPOSE 5001

ENV NODE_ENV=production

# Start both the Express server and .NET WebAPI
ENTRYPOINT ["./docker-entrypoint.sh"]