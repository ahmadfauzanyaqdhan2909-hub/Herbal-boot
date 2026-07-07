#!/usr/bin/env node
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const SECRET = process.env.V7LA_BRIDGE_SECRET || 'BOS-COMMAND-PIPELINE';
const urlFile = path.join(__dirname, '..', '.v7la_bridge_url');

const C = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m'
};

function fetchGistUrl(pat, gistId) {
    return new Promise((resolve, reject) => {
        const https = require('https');
        const options = {
            hostname: 'api.github.com',
            path: `/gists/${gistId}`,
            method: 'GET',
            headers: {
                'Authorization': `token ${pat}`,
                'User-Agent': 'V7LA-CloudPort'
            }
        };
        https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const gist = JSON.parse(data);
                    if (gist.files && gist.files['v7la_bridge.json']) {
                        const content = JSON.parse(gist.files['v7la_bridge.json'].content);
                        resolve(content.url);
                    } else {
                        resolve(null);
                    }
                } catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

async function main() {
    let targetUrl = process.env.V7LA_BRIDGE_URL;

    const gistConfigPath = path.join(__dirname, '..', '.v7la_gist_config.json');
    if (!targetUrl && fs.existsSync(gistConfigPath)) {
        try {
            const gistConfig = JSON.parse(fs.readFileSync(gistConfigPath, 'utf8'));
            console.log(`${C.cyan}⟳ Fetching latest Bridge URL from Gist Mailbox...${C.reset}`);
            const fetchedUrl = await fetchGistUrl(gistConfig.pat, gistConfig.gist_id);
            if (fetchedUrl === "") {
                console.log(`${C.yellow}! Gist Mailbox is empty (URL not received yet). Falling back to local file.${C.reset}`);
            } else if (fetchedUrl) {
                targetUrl = fetchedUrl;
                // Save it to .v7la_bridge_url for fallback
                fs.writeFileSync(urlFile, targetUrl);
                console.log(`${C.green}✓ Synchronized: ${targetUrl}${C.reset}`);
            } else {
                console.log(`${C.red}× Failed to fetch Gist content. Server might be down. Falling back to local file.${C.reset}`);
            }
        } catch (e) {
            console.log(`${C.red}× Gist Fetch Error: ${e.message}${C.reset}`);
        }
    }

    if (!targetUrl) {
        if (fs.existsSync(urlFile)) {
            targetUrl = fs.readFileSync(urlFile, 'utf8').trim();
        } else {
            targetUrl = 'https://monadelphous-nonexperimentally-anette.ngrok-free.dev';
            console.log(`${C.yellow}⚠️ Warning: .v7la_bridge_url not found. Using fallback Ngrok URL.${C.reset}`);
        }
    }

    // Convert HTTP/HTTPS to WS/WSS
    if (targetUrl.startsWith('http')) {
        targetUrl = targetUrl.replace('http', 'ws');
    }
    // Remove trailing slash if present
    if (targetUrl.endsWith('/execute') || targetUrl.endsWith('/')) {
        targetUrl = targetUrl.replace(/\/execute$/, '').replace(/\/$/, '');
    }

    console.log(`${C.magenta}╔══════════════════════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.magenta}║  V7LA CLOUD-NATIVE TERMINAL v1.7.0 (FULL-DUPLEX PTY)     ║${C.reset}`);
    console.log(`${C.magenta}╚══════════════════════════════════════════════════════════╝${C.reset}`);
    console.log(`${C.cyan}⟳ Connecting to Bridge at ${targetUrl}...${C.reset}`);
    console.log(`${C.yellow}ℹ️  Press Ctrl+] to disconnect locally without killing cloud.${C.reset}\n`);

    const ws = new WebSocket(targetUrl, {
        headers: {
            Authorization: `Bearer ${SECRET}`,
            'ngrok-skip-browser-warning': 'true' // Bypass Ngrok's free tier warning screen
        }
    });

    ws.on('open', () => {
        // Keep-alive heartbeat to prevent Ngrok drop during long silences (e.g. Next.js compiling)
        const heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            }
        }, 15000);

        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
        process.stdin.resume();

        process.stdin.on('data', (data) => {
            if (data.length === 1 && data[0] === 0x1d) {
                console.log(`\n${C.yellow}[-] Disconnected locally by User (Cloud Saraf remains active).${C.reset}`);
                process.exit(0);
            }
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });
    });

    ws.on('message', (data) => {
        process.stdout.write(data);
    });

    ws.on('close', (code, reason) => {
        console.log(`\n${C.red}❌ Connection closed by remote host. (Code: ${code})${C.reset}`);
        process.exit(0);
    });

    ws.on('error', (err) => {
        console.error(`\n${C.red}❌ Connection Error: ${err.message}${C.reset}`);
        process.exit(1);
    });
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
