#!/usr/bin/env node
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const os = require('os');
const crypto = require('crypto');

// Configuration
const PORT = process.env.V7LA_BRIDGE_PORT || 3001;
const SECRET = process.env.V7LA_BRIDGE_SECRET || 'BOS-COMMAND-PIPELINE';

const C = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    bold: '\x1b[1m',
    reset: '\x1b[0m'
};

console.log(`${C.bold}${C.magenta}🛰️  V7LA CLOUD-NATIVE CLI SERVER ACTIVE${C.reset}`);
console.log(`  Bridge Port  : ${PORT}`);
console.log(`  Bridge Secret: ${C.yellow}${SECRET}${C.reset}`);
console.log(`  Mode         : [WebSocket + PTY Mode]`);
console.log(`  Status       : Listening for Antigravity Brain commands...\n`);

// Create HTTP server for health checks / legacy commands
const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        res.writeHead(200);
        res.end('V7LA Cloud-Native Bridge is Online.');
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    console.log(`\n  ${C.cyan}[+] Native Connection Attempt Dideteksi...${C.reset}`);

    // Check Authorization header or query param
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${SECRET}`) {
        console.log(`  ${C.red}[!] Unauthorized WebSocket connection blocked.${C.reset}`);
        ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized connection.' }));
        ws.close(4001, 'Unauthorized');
        return;
    }

    console.log(`  ${C.green}[+] Authentication Successful. Spawning Bash PTY...${C.reset}`);

    // Spawn a PTY session
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const args = os.platform() === 'win32' ? [] : ['--login', '-i'];
    const ptyProcess = pty.spawn(shell, args, {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: '/content/V7LA-CLOUDPORT',
        env: Object.assign({}, process.env, {
            V7LA_PROJECT_ROOT: '/content/V7LA-CLOUDPORT',
            V7LA_CORE_ROOT: '/content/V7LA-CLOUDPORT'
        })
    });

    // Send PTY output to WebSocket
    ptyProcess.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });

    // Receive WebSocket input and send to PTY
    ws.on('message', (msg) => {
        ptyProcess.write(msg.toString());
    });

    ws.on('close', () => {
        clearInterval(heartbeat);
        console.log(`  ${C.yellow}[-] Client Disconnected. Terminating PTY Session.${C.reset}`);
        ptyProcess.kill();
    });

    // Give initial login feedback
    ws.send(`\x1b[1;35m[V7LA Cloud-Native Saraf Bridge Established]\x1b[0m\r\n`);

    // Server-side heartbeat to prevent Ngrok from dropping idle connections
    const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    }, 20000);
});

server.listen(PORT, () => {
    console.log(`Ready on port ${PORT}`);
});
