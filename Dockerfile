# Use Node.js 20 on Debian Slim (better for native modules like LiveKit than Alpine)
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install necessary system dependencies for native modules (if any)
# LiveKit usually needs some basics if prebuilds fail, but slim + glibc covers most cases.
# We update apt-get just in case we need to add libs later.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose the port
EXPOSE 3000

# Command to run the agent
CMD ["npm", "run", "start"]
