module.exports = {
  apps: [
    {
      name: "sakae-agent",
      script: "server/agent.js",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        // Ensure these match your .env or are set in the VM
        PORT: 3000,
        AGENT_PORT: 8081
      },
      args: "start"
    }
  ]
};
