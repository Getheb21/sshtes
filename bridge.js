// ============================================
// HYBRID BRIDGE - WS + SSL + SNI
// ============================================

const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const net = require('net');
const tls = require('tls');
const url = require('url');

const WS_PORT = 8080;
const TLS_PORT = 48495;
const SSH_HOST = '127.0.0.1';
const SSH_PORT = 22;

// ====== 1. HTTP + WebSocket Server ======
const httpServer = createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'running',
      protocols: ['websocket', 'tls', 'http'],
      ssh: true,
      sni: parsedUrl.query.sni || 'default'
    }));
    return;
  }
  
  // Halaman utama
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(getDashboard());
});

// WebSocket handler
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
  console.log('[WS] Client connected:', req.socket.remoteAddress);
  
  // Connect ke SSH
  const sshSocket = net.createConnection({ host: SSH_HOST, port: SSH_PORT }, () => {
    console.log('[WS] Connected to SSH');
    
    // Forward WS ↔ SSH
    ws.on('message', (data) => {
      if (sshSocket.writable) sshSocket.write(data);
    });
    
    sshSocket.on('data', (data) => {
      if (ws.readyState === 1) ws.send(data);
    });
  });
  
  sshSocket.on('error', (err) => {
    console.error('[WS] SSH error:', err.message);
    ws.close();
  });
  
  ws.on('close', () => {
    console.log('[WS] Client disconnected');
    sshSocket.end();
  });
  
  sshSocket.on('close', () => {
    ws.close();
  });
});

httpServer.listen(WS_PORT, '0.0.0.0', () => {
  console.log('[WS] WebSocket Server on port', WS_PORT);
});

// ====== 2. TLS Server (Stunnel style) ======
const tlsServer = tls.createServer({
  key: require('fs').readFileSync('/etc/stunnel/stunnel.pem'),
  cert: require('fs').readFileSync('/etc/stunnel/stunnel.pem'),
  rejectUnauthorized: false
}, (socket) => {
  console.log('[TLS] Client connected:', socket.remoteAddress);
  
  // Check SNI
  const sni = socket.servername || 'unknown';
  console.log('[TLS] SNI:', sni);
  
  const sshSocket = net.createConnection({ host: SSH_HOST, port: SSH_PORT }, () => {
    console.log('[TLS] Connected to SSH');
    socket.pipe(sshSocket);
    sshSocket.pipe(socket);
  });
  
  sshSocket.on('error', (err) => {
    console.error('[TLS] SSH error:', err.message);
    socket.end();
  });
  
  socket.on('error', (err) => {
    console.error('[TLS] Client error:', err.message);
    sshSocket.end();
  });
  
  socket.on('close', () => sshSocket.end());
  sshSocket.on('close', () => socket.end());
});

tlsServer.listen(TLS_PORT, '0.0.0.0', () => {
  console.log('[TLS] SSL/TLS Server on port', TLS_PORT);
});

// Dashboard
function getDashboard() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SSH Proxy Hub</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0d1117;color:#c9d1d9;font-family:monospace;padding:20px}
.container{max-width:700px;margin:0 auto}
h1{color:#58a6ff;margin-bottom:8px}
.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:16px;margin:12px 0}
.card h3{color:#fff;margin-bottom:8px;font-size:14px}
code{display:block;background:#0d1117;padding:8px;border-radius:4px;color:#7ee787;font-size:12px;margin:4px 0;word-break:break-all}
.tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold;margin:2px}
.tag-ws{background:#238636}
.tag-tls{background:#1f6feb}
.tag-ssh{background:#da3633}
.status{color:#3fb950}
</style>
</head>
<body>
<div class="container">
<h1>SSH Proxy Hub</h1>
<p style="color:#8b949e;font-size:12px">Multi-protocol SSH Proxy</p>

<div class="card">
<h3>WebSocket</h3>
<code>ws://DOMAIN:PORT/</code>
<p style="font-size:11px;color:#8b949e;margin-top:4px">Connect via WebSocket client</p>
</div>

<div class="card">
<h3>SSL/TLS (Stunnel)</h3>
<code>DOMAIN:48495</code>
<p style="font-size:11px;color:#8b949e;margin-top:4px">Connect via stunnel/openssl</p>
</div>

<div class="card">
<h3>Client Commands</h3>
<p style="font-size:11px;color:#8b949e">WebSocket:</p>
<code>websocat ws://DOMAIN:PORT/</code>
<p style="font-size:11px;color:#8b949e;margin-top:8px">SSL/TLS:</p>
<code>openssl s_client -connect DOMAIN:48495</code>
<p style="font-size:11px;color:#8b949e;margin-top:8px">SSH via WebSocket:</p>
<code>ssh -o ProxyCommand="websocat ws://DOMAIN:PORT/" user@localhost</code>
</div>

<div class="card">
<h3>Status: <span class="status">RUNNING</span></h3>
<p style="font-size:11px;color:#8b949e">
<span class="tag tag-ws">WS:8080</span>
<span class="tag tag-tls">TLS:48495</span>
<span class="tag tag-ssh">SSH:22</span>
</p>
</div>
</div>
</body>
</html>`;
}
