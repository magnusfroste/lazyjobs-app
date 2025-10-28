FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all application files
COPY . .

# Verify files are copied
RUN ls -la /app && echo "Files copied successfully"

# Run the connector
CMD ["node", "fetch-jobs.js"]
