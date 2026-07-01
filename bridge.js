const { WebSocketServer } = require('ws');
const net = require('net');
const http = require('http');

const PORT = process.env.PORT || 8080;
const SSH_HOST = '127.0.0.1';
const SSH_PORT = 22;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('SSH WS Tunnel OK');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('[+] Client connected:', req.socket.remoteAddress);
  
  const ssh = net.createConnection({ host: SSH_HOST, port: SSH_PORT }, () => {
    console.log('[+] SSH connected');
    
    ws.on('message', (data) => {
      if (ssh.writable) ssh.write(data);
    });
    
    ssh.on('data', (data) => {
      if (ws.readyState === 1) ws.send(data);
    });
  });
  
  ssh.on('error', (err) => {
    console.error('[-] SSH error:', err.message);
    ws.close();
  });
  
  ws.on('close', () => {
    console.log('[-] Client disconnected');
    ssh.end();
  });
  
  ssh.on('close', () => ws.close());
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('============================================');
  console.log('  SSH WS TUNNEL READY');
  console.log('  Port: ' + PORT);
  console.log('============================================');
});
