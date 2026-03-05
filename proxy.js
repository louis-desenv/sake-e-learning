import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import "dotenv/config"; // Ensure env vars are loaded

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (clientWs) => {
  console.log('Client connected to proxy');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ MISSING OPENAI_API_KEY in environment variables");
    clientWs.close(1008, "Missing API Key");
    return;
  }

  const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'realtime=v1',
    },
  });

  openaiWs.on('open', () => {
    console.log('Connected to OpenAI');
  });

  openaiWs.on('message', (data) => {
    clientWs.send(data);
  });

  clientWs.on('message', (data) => {
    openaiWs.send(data);
  });

  clientWs.on('close', () => {
    console.log('Client disconnected');
    openaiWs.close();
  });

  openaiWs.on('close', () => {
    console.log('OpenAI disconnected');
    clientWs.close();
  });

  openaiWs.on('error', (error) => {
    console.error('OpenAI WS error:', error);
    clientWs.close();
  });

  clientWs.on('error', (error) => {
    console.error('Client WS error:', error);
    openaiWs.close();
  });
});

server.listen(8082, () => {
  console.log('Proxy server listening on ws://localhost:8082');
});
