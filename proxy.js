import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (clientWs) => {
  console.log('Client connected to proxy');

  const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
    headers: {
      'Authorization': 'Bearer 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',
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

server.listen(8081, () => {
  console.log('Proxy server listening on ws://localhost:8081');
});
