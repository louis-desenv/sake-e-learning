# Use Node.js 18 on Alpine Linux for a small footprint
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first to cache dependencies
COPY package.json package-lock.json ./

# Install dependencies (only production if you want strictly prod, but usually safe to install all for agents)
# omitting --production to ensure all livekit plugins are available if they were saved improperly, 
# but mostly 'npm ci' is best for lock file respect.
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose the port the health check server runs on (defined in server/agent.js)
EXPOSE 3000

# Command to run the agent
CMD ["npm", "run", "start"]
