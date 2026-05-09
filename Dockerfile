# Use Node 26 (or 20+ as fallback if 26 is not available in standard images yet)
FROM node:20-alpine

WORKDIR /app

# Copy root package.json and workspace configuration
COPY package.json ./

# Copy server and client package.json files
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies for all workspaces
RUN npm run install:all

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Expose port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Run the server
CMD ["npm", "start"]
