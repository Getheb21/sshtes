const { WebSocketServer } = require('ws');
const net = require('net');
const http = require('http');

const PORT = 8080;
const SSH_HOST = '127.0.0.1';
const SSH_PORT = 22;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`SSH WS Tunnel Running`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('[+] Client connected');
  
  const ssh = net.createConnection({ host: SSH_HOST, port: SSH_PORT }, () => {
    ws.on('message', (data) => {
      if (ssh.writable) ssh.write(data);
    });
    
    ssh.on('data', (data) => {
      if (ws.readyState === 1) ws.send(data);
    });
  });
  
  ssh.on('error', () => ws.close());
  ws.on('close', () => ssh.end());
  ssh.on('close', () => ws.close());
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('SSH WS Tunnel on port', PORT);
});
