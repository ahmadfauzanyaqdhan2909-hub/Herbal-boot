#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const configPath = path.join(__dirname, '..', '.v7la_gist_config.json');

if (process.argv.length < 3) {
    console.log("Usage: node bin/v7la_setup_gist.js <GITHUB_PAT>");
    process.exit(1);
}

const pat = process.argv[2];

const data = JSON.stringify({
    description: "V7LA CloudPort Bridge URL",
    public: false,
    files: {
        "v7la_bridge.json": {
            content: JSON.stringify({ url: "", updated_at: new Date().toISOString() })
        }
    }
});

const options = {
    hostname: 'api.github.com',
    path: '/gists',
    method: 'POST',
    headers: {
        'Authorization': `token ${pat}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'V7LA-CloudPort',
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (d) => {
        responseData += d;
    });

    res.on('end', () => {
        if (res.statusCode === 201) {
            const gist = JSON.parse(responseData);
            const config = {
                pat: pat,
                gist_id: gist.id
            };
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(`✅ [SUCCESS] Gist created! ID: ${gist.id}`);
            console.log(`📦 Configuration saved to ${configPath}`);
        } else {
            console.error(`❌ [ERROR] Failed to create Gist. Status: ${res.statusCode}`);
            console.error(responseData);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ [ERROR] Request failed: ${e.message}`);
});

req.write(data);
req.end();
