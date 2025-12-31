# Azure Deployment Guide for SAKE E-Learning App

This guide provides step-by-step instructions for hosting your SAKE e-learning application on Microsoft Azure.

## Prerequisites

- Azure account with active subscription
- GitHub repository (recommended for CI/CD)
- Node.js application ready for deployment

## Architecture Overview

Your application consists of:
- **Frontend**: React/Vite SPA served on port 5000 (preview mode)
- **Proxy Service**: WebSocket proxy to OpenAI Realtime API on port 8081
- **Agent Service**: LiveKit voice agent with Bey avatar integration

## Deployment Options

### Option 1: Azure App Service with Node.js (Recommended)

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Create Azure App Service**
   - Go to Azure Portal → App Services → Create
   - Runtime: Node.js 18 LTS
   - Operating System: Linux
   - Publish: Code

3. **Configure App Service**
   - Go to Configuration → Application Settings
   - Add all environment variables from your `.env` file:
     ```
     OPENAI_API_KEY=your_openai_key
     BEY_API_KEY=your_bey_key
     LIVEKIT_API_KEY=your_livekit_key
     LIVEKIT_API_SECRET=your_livekit_secret
     LIVEKIT_URL=your_livekit_url
     BEY_AVATAR_ID=your_avatar_id
     ```

4. **Deploy Code**
   - Use GitHub Actions for CI/CD or deploy manually via ZIP
   - For manual deployment: Upload the entire project as ZIP

5. **Configure Startup Command**
   - In App Service Configuration → General Settings
   - Startup Command: `npm install -g pm2 && pm2 start ecosystem.config.js --no-daemon`
   - Create `ecosystem.config.js` in your project root:
     ```javascript
     module.exports = {
       apps: [
         {
           name: 'proxy',
           script: 'proxy.js'
         },
         {
           name: 'agent',
           script: 'agent.js'
         },
         {
           name: 'web',
           script: 'npm',
           args: 'run preview'
         }
       ]
     };
     ```

### Option 2: Azure Container Apps (Alternative)

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .

   RUN npm run build
   RUN npm install -g pm2

   RUN echo 'module.exports = { apps: [{ name: "proxy", script: "proxy.js" }, { name: "agent", script: "agent.js" }, { name: "web", script: "npm", args: "run preview" }] }' > ecosystem.config.js

   EXPOSE 8080 8081 5000
   CMD ["pm2-runtime", "ecosystem.config.js"]
   ```

2. **Build and Push to Azure Container Registry**
   ```bash
   az acr build --registry <your-registry> --image sake-app:latest .
   ```

3. **Create Azure Container App**
   - Go to Azure Portal → Container Apps → Create
   - Use your container image
   - Set environment variables
   - Configure ingress for port 5000

## Environment Variables

Ensure all required environment variables are set in Azure:

```env
OPENAI_API_KEY=sk-proj-...
BEY_API_KEY=sk-ioKQP6TMmLufg-...
LIVEKIT_API_KEY=API4DzuzbMC3E9X
LIVEKIT_API_SECRET=DseZQ3MOPSmSILraZdlwjAuRNeNhuXhQBeWhWfSHYf8G
LIVEKIT_URL=wss://sakae-5xpuk5nz.livekit.cloud
BEY_AVATAR_ID=your_avatar_id
```

## Networking Considerations

- **WebSocket Support**: Ensure Azure App Service supports WebSocket connections (enabled by default)
- **Ports**: Configure firewall rules if needed for ports 8081 (proxy) and LiveKit connections
- **CORS**: Update CORS settings in `vite.config.ts` for production domain

## Monitoring and Scaling

1. **Application Insights**: Enable for monitoring and logging
2. **Auto-scaling**: Configure based on CPU/memory usage
3. **Health Checks**: Implement health endpoints for services

## Security Best Practices

1. **Secrets Management**: Use Azure Key Vault for sensitive data
2. **Network Security**: Configure VNet integration if needed
3. **Authentication**: Implement proper auth for production
4. **HTTPS**: Ensure SSL/TLS is enabled (Azure provides free certificates)

## Troubleshooting

- **Port Conflicts**: Ensure services don't conflict with Azure's reserved ports
- **Memory Limits**: Monitor resource usage, consider upgrading App Service plan if needed
- **WebSocket Issues**: Check Azure's WebSocket support and firewall rules
- **Environment Variables**: Verify all required vars are set correctly

## Cost Optimization

- Use consumption-based plans for development/testing
- Implement auto-scaling to handle traffic spikes
- Monitor usage and adjust resource allocation as needed

## Next Steps

1. Test deployment in staging environment
2. Configure custom domain and SSL
3. Set up monitoring and alerting
4. Implement backup and disaster recovery
5. Document maintenance procedures
