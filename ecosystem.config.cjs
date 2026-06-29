require('dotenv').config();

module.exports = {
  apps: [
    {
      name: "sakae-agent",
      script: "dist/server/agent.js",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        ...process.env,
        PORT: process.env.PORT || 3001,
        AGENT_PORT: process.env.AGENT_PORT || 8082
      },
      args: "start"
    }
  ]
};
