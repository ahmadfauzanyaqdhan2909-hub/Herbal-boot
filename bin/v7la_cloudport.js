#!/usr/bin/env node
/**
 * v7la_cloudport.js
 * Automates the assembly of the V7LA-CLOUDPORT-SUITE for Google Colab/Linux.
 * Skips Windows binaries and injects the Colab bridge.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CORE_ROOT = process.env.V7LA_CORE_ROOT || path.resolve(__dirname, '..');
const SUITE_NAME = 'V7LA-CLOUDPORT-SUITE';
const SUITE_PATH = path.join(CORE_ROOT, SUITE_NAME);
const IS_WINDOWS = process.platform === 'win32';

// Arguments Parsing
const args = process.argv.slice(2);
let targetProject = null;
if (args.includes('--project')) {
    targetProject = args[args.indexOf('--project') + 1];
}

// ANSI colors
const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
};

function header(title) {
    console.log(`\n${C.bold}${C.magenta}╔${'═'.repeat(60)}╗${C.reset}`);
    console.log(`${C.bold}${C.magenta}║  ${title.padEnd(58)}║${C.reset}`);
    console.log(`${C.bold}${C.magenta}╚${'═'.repeat(60)}╝${C.reset}\n`);
}

function efficientSync(src, dest, excludes = []) {
    if (IS_WINDOWS) {
        // Use Robocopy for high-speed multi-threaded sync
        const excludeDirs = excludes.filter(e => !e.includes('*')).map(d => `"${d}"`).join(' ');
        const excludeFiles = excludes.filter(e => e.includes('*')).map(f => `"${f}"`).join(' ');
        const xd = excludeDirs ? `/XD ${excludeDirs}` : '';
        const xf = excludeFiles ? `/XF ${excludeFiles}` : '';

        try {
            // High-speed sync with native exclusions
            execSync(`robocopy "${src}" "${dest}" /E /MIR /R:1 /W:1 /MT:32 ${xd} ${xf}`, { stdio: 'inherit' });
        } catch (e) {
            if (e.status > 7) throw e;
        }
    } else {
        // Linux/Colab fallback
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        execSync(`cp -ru "${src}/." "${dest}"`, { stdio: 'inherit' });
    }
}

async function bundleCloudSuite() {
    header('V7LA-CLOUDPORT ULTRA-FAST GENERATOR v2.0.0');

    try {
        // [0] Force Wipe existing Suite for a truly Clean Build
        if (fs.existsSync(SUITE_PATH)) {
            console.log(`  ${C.yellow}⟳${C.reset} Purging old Suite (Ensuring Zero Bloat)...`);
            if (IS_WINDOWS) {
                execSync(`powershell -Command "Remove-Item -Path '${SUITE_PATH}' -Recurse -Force -ErrorAction SilentlyContinue"`);
            } else {
                execSync(`rm -rf "${SUITE_PATH}"`);
            }
        }

        // [1] Ensure SUITE Folder Structure
        console.log(`  ${C.cyan}⟳${C.reset} Synchronizing CloudPort Structure...`);
        const dirs = [
            SUITE_PATH,
            path.join(SUITE_PATH, 'bin'),
            path.join(SUITE_PATH, 'vault'),
            path.join(SUITE_PATH, 'app'),
            path.join(SUITE_PATH, 'runtime')
        ];
        dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

        // [2.1] Copy Portable Runtime
        console.log(`  ${C.cyan}⟳${C.reset} Packing Portable Node Runtime...`);
        const runtimeSrc = path.join(CORE_ROOT, 'V7LA-PORTABLE-SUITE', 'runtime');
        if (fs.existsSync(runtimeSrc)) {
            efficientSync(runtimeSrc, path.join(SUITE_PATH, 'runtime'));
        }

        // [2] Copy Core Scripts (Bin) - Multi-threaded Sync
        console.log(`  ${C.cyan}⟳${C.reset} Packing Core Scripts (Bin)...`);
        efficientSync(path.join(CORE_ROOT, 'bin'), path.join(SUITE_PATH, 'bin'));

        // [3] Copy Master Vault Cache & Protocol (Including Flag)
        console.log(`  ${C.cyan}⟳${C.reset} Packing Knowledge Vault, Protocol, and Flags...`);
        const vaultSrc = path.join(CORE_ROOT, 'lancedb_v7la_cache.json');
        if (fs.existsSync(vaultSrc)) {
            fs.copyFileSync(vaultSrc, path.join(SUITE_PATH, 'vault', 'lancedb_v7la_cache.json'));
            fs.copyFileSync(vaultSrc, path.join(SUITE_PATH, 'lancedb_v7la_cache.json'));
        }
        const protocolSrc = path.join(CORE_ROOT, 'v7la_protocol.json');
        if (fs.existsSync(protocolSrc)) {
            fs.copyFileSync(protocolSrc, path.join(SUITE_PATH, 'vault', 'v7la_protocol.json'));
            fs.copyFileSync(protocolSrc, path.join(SUITE_PATH, 'v7la_protocol.json'));
        }
        const flagSrc = path.join(CORE_ROOT, '.v7la-version-flag');
        if (fs.existsSync(flagSrc)) {
            fs.copyFileSync(flagSrc, path.join(SUITE_PATH, '.v7la-version-flag'));
        }

        // [4] Copy Target Project (With Deep Exclusion)
        if (targetProject) {
            const projectSrc = path.join(CORE_ROOT, targetProject);
            if (fs.existsSync(projectSrc)) {
                console.log(`  ${C.yellow}🚀${C.reset} Packing Project (Deep Exclusion Mode): ${C.bold}${targetProject}${C.reset}...`);
                const projectDest = path.join(SUITE_PATH, 'app', targetProject);

                const deepExcludes = [
                    'node_modules', '.git', '.next', 'dist', 'build', '.cache',
                    'backups_db', 'qa_screenshots', 'lancedb_v7la_test',
                    'DIST-V7NP-Final', 'LMS_Standalone', 'DIST-Portable-EXE',
                    'uploads', 'challenges', 'out', 'storage'
                ];
                const fileExcludes = ['*.zip', '*.exe', '*.log', '*.tmp'];

                efficientSync(projectSrc, projectDest, deepExcludes.concat(fileExcludes));
                console.log(`  ${C.green}✓${C.reset} Project synchronized. (Caches, Zips & Node_Modules excluded).`);
            } else {
                console.log(`  ${C.red}×${C.reset} Project folder not found: ${targetProject}`);
            }
        }

        // [5] Inject Colab Bridge
        console.log(`  ${C.cyan}⟳${C.reset} Injecting CO-LAB-START.ipynb...`);
        const colabSrc = path.join(CORE_ROOT, 'bin', 'CO-LAB-START.ipynb');
        if (fs.existsSync(colabSrc)) {
            let colabJson = JSON.parse(fs.readFileSync(colabSrc, 'utf8'));
            const gistConfigPath = path.join(CORE_ROOT, '.v7la_gist_config.json');
            if (fs.existsSync(gistConfigPath)) {
                try {
                    const gistConfig = JSON.parse(fs.readFileSync(gistConfigPath, 'utf8'));
                    console.log(`  ${C.yellow}✓${C.reset} Injecting Gist Auto-Sync Mailbox Credentials...`);

                    const patchCode = `
    # [V7LA AUTO-SYNC] Mengirim URL ke Kotak Pos Gist
    try:
        import requests, json, datetime
        headers = {"Authorization": "token ${gistConfig.pat}", "Accept": "application/vnd.github.v3+json"}
        payload = {"url": public_url, "updated_at": str(datetime.datetime.now())}
        data = {"files": {"v7la_bridge.json": {"content": json.dumps(payload)}}}
        r = requests.patch("https://api.github.com/gists/${gistConfig.gist_id}", json=data, headers=headers)
        if r.status_code == 200:
            print(f"\\n📧 Berhasil mengirim URL ke Kotak Pos Gist!")
        else:
            print(f"\\n❌ Gagal mengirim ke Gist: {r.status_code}")
    except ImportError:
        !pip install requests --quiet
        import requests, json, datetime
        headers = {"Authorization": "token ${gistConfig.pat}", "Accept": "application/vnd.github.v3+json"}
        payload = {"url": public_url, "updated_at": str(datetime.datetime.now())}
        data = {"files": {"v7la_bridge.json": {"content": json.dumps(payload)}}}
        r = requests.patch("https://api.github.com/gists/${gistConfig.gist_id}", json=data, headers=headers)
        if r.status_code == 200:
            print(f"\\n📧 Berhasil mengirim URL ke Kotak Pos Gist!")
    except Exception as e:
        print(f"\\n❌ Error Gist Sync: {e}")
`;
                    const bridgeCell = colabJson.cells.find(c => c.metadata && c.metadata.id === 'bridge_setup');
                    if (bridgeCell) {
                        const targetLineIndex = bridgeCell.source.findIndex(line => line.includes('print(f"\\n👉 Tolong COPY URL di atas'));
                        if (targetLineIndex !== -1) {
                            bridgeCell.source.splice(targetLineIndex + 1, 0, ...patchCode.split('\n').filter(l => l.trim() !== '').map(l => l + '\n'));
                        }
                    }
                } catch (e) { console.error("Gist injection failed:", e.message); }
            }

            // Inject Web App Proxy Cells
            colabJson.cells.push({
                cell_type: "code",
                execution_count: null,
                metadata: { id: "colab_proxy" },
                outputs: [],
                source: [
                    "# [OPSIONAL] Web App Proxy & Tunneling (Cloudflare)\n",
                    "import os, time, re\n",
                    "if not os.path.exists('cloudflared-linux-amd64'):\n",
                    "  !wget -q -nc https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64\n",
                    "  !chmod +x cloudflared-linux-amd64\n",
                    "\n",
                    "print(\"⟳ Menghidupkan Cloudflare Tunnel...\")\n",
                    "!pkill -f cloudflared\n",
                    "!rm -f tunnel.log\n",
                    "!nohup ./cloudflared-linux-amd64 tunnel --url http://localhost:3000 > tunnel.log 2>&1 &\n",
                    "\n",
                    "domain = None\n",
                    "for _ in range(15):\n",
                    "    time.sleep(1)\n",
                    "    if os.path.exists('tunnel.log'):\n",
                    "        with open('tunnel.log', 'r') as f:\n",
                    "            match = re.search(r'https://[a-zA-Z0-9-]+\\\\.trycloudflare\\\\.com', f.read())\n",
                    "            if match:\n",
                    "                domain = match.group(0)\n",
                    "                break\n",
                    "\n",
                    "if domain:\n",
                    "    print(f\"\\n✅ LINK APLIKASI BAPAK: {domain}\")\n",
                    "else:\n",
                    "    print(\"\\n❌ Gagal mendapatkan link Cloudflare. Coba jalankan ulang cell ini.\")\n"
                ]
            });

            // Inject Anti-Sleep Heartbeat Cell
            colabJson.cells.push({
                cell_type: "code",
                execution_count: null,
                metadata: { id: "anti_sleep" },
                outputs: [],
                source: [
                    "# [AUTO] V7LA Anti-Sleep Heartbeat Agent\n",
                    "from IPython.display import Javascript\n",
                    "display(Javascript('''\n",
                    "function KlickerSakti() {\n",
                    "    console.log(\"V7LA Heartbeat: Memastikan Colab tetap Siaga...\");\n",
                    "    const btn = document.querySelector(\"colab-connect-button\");\n",
                    "    if (btn) btn.click();\n",
                    "}\n",
                    "setInterval(KlickerSakti, 60000);\n",
                    "console.log(\"✅ V7LA Anti-Sleep Agent AKTIF di Browser Bapak!\");\n",
                    "'''))\n"
                ]
            });

            fs.writeFileSync(path.join(SUITE_PATH, 'CO-LAB-START.ipynb'), JSON.stringify(colabJson, null, 4));
        }

        // [6] Inject Setup Script for Linux
        console.log(`  ${C.cyan}⟳${C.reset} Injecting setup-colab.sh...`);
        const setupContent = `#!/bin/bash
echo "🛡️ V7LA CLOUDPORT — One-Shot Activation (Linux)..."

# 1. Install Linux-Native Dependencies (LanceDB & VPL Term)
if [ ! -f "node_modules/.v7la_colab_ready" ]; then
    echo "📦 Installing Linux core dependencies..."
    npm install lancedb @lancedb/lancedb-linux-x64-gnu ws node-pty --quiet --no-progress
    mkdir -p node_modules && touch node_modules/.v7la_colab_ready
fi

# 2. Setup Project Dependencies (Smart Skip)
if [ -d "./app" ]; then
    for d in ./app/* ; do
        if [ -d "$d" ]; then
            proj_name=$(basename "$d")
            if [ ! -d "$d/node_modules" ]; then
                echo "📦 Project '$proj_name': Installing dependencies..."
                cd "$d" && npm install --omit=dev --quiet --no-progress
                cd ../..
            else
                echo "⏩ Project '$proj_name': Skipping install (node_modules found)."
            fi
        fi
    done
fi

# 3. Register Global Aliases (Clean Append)
if ! grep -q "V7LA Master Hub" ~/.bashrc; then
    echo "🔗 Registering V7LA Master Hub Aliases..."
    cat << 'EOF' >> ~/.bashrc

# --- V7LA Master Hub v1.7.0 ---
alias n='node bin/v7la_nexus_pipeline.js'
alias m='node bin/v7la_nexus_pipeline.js "[STRATEGY ONLY]"'
alias k='node bin/v7la_explorer.js'
alias j='node bin/v7la_judge.js'
alias v='node bin/v7la_status.js'
alias rr='node bin/v7la_repair.js'
alias q='node bin/v7la_drill.js'
function d_dev() {
    if [ -d "./app/lms-platform" ]; then
        fuser -k 3000/tcp 2>/dev/null
        cd app/lms-platform && npm run dev &
        sleep 5
        python3 -c "from google.colab.output import eval_js; print('\\n🚀 V7LA Cloud-Port 3000 is ready at: ' + eval_js('google.colab.kernel.proxyPort(3000)'))" 2>/dev/null || echo "\\n🚀 Gunakan cell Colab Proxy di notebook untuk mendapatkan link!"
        cd ../..
    else
        echo "❌ Project lms-platform not found."
    fi
}
alias d=d_dev

alias a='node bin/v7la_nexus_pipeline.js'
alias compose='node bin/v7la_composer.js'
alias l='node bin/v7la_layer_init.js'
alias 1='node bin/v7la_layer_init.js'
alias c='node bin/v7la_layer_init.js'
alias b='node bin/v7la_backup.js'
alias r='node app/lms-platform/packages/db/seed_donny_master.js'
alias e='node bin/v7la_export_master.js'
alias i='node bin/v7la_sync.js'
alias s='node bin/v7la_sync.js --quick'
alias build='node bin/v7la_vport_bundle.js --distro'
alias v-port='node bin/v7la_vport_factory.js'
alias vp='node bin/v7la_vport_bundle.js'
alias vpl='node bin/v7la_cloudport.js'
alias vpl1='node bin/v7la_cloudport.js'
alias vpl-auto='node bin/v7la_cloudport.js'
alias v-bridge='node bin/v7la_cloud_bridge.js'
alias start-pilot='node bin/v7la_watchdog.js > /dev/null 2>&1 &'
alias build-fix='npm run build || node bin/v7la_repair.js'
alias vhelp='node bin/v7la_status.js --help'

#// 4. Install Cloud Bridge & Native CLI Dependencies (Optional but Recommended)
if [ ! -f "node_modules/.v7la_bridge_ready" ]; then
    echo "📦 Installing Cloud Native CLI dependencies (ws, node-pty, ngrok)..."
    npm install ngrok ws node-pty --quiet --no-progress
    touch node_modules/.v7la_bridge_ready
fi
EOF

    # Dynamic Project Aliases
    if [ -d "./app" ]; then
        for d in ./app/* ; do
            if [ -d "$d" ]; then
                raw_proj=$(basename "$d")
                clean_proj=$(echo "$raw_proj" | sed 's/^lms-//')
                echo "alias vpl-auto-$clean_proj='node bin/v7la_cloudport.js --project $raw_proj'" >> ~/.bashrc
            fi
        done
    fi
fi

echo "✅ Activation Complete. Pak Bos bisa langsung mengetik shortcut (seperti 'v', 'n', 'm') di terminal."\n`;
        fs.writeFileSync(path.join(SUITE_PATH, 'setup-colab.sh'), setupContent);

        console.log(`\n  ${C.green}✅ V7LA-CLOUDPORT assembled successfully!${C.reset}`);
        console.log(`  ${C.bold}Folder: ${SUITE_PATH}${C.reset}\n`);

    } catch (error) {
        console.error(`\n  ${C.bold}${C.red}❌ CloudPort Failed:${C.reset}`, error.message);
    }
}

// Global exclusion for V7LA core files
if (IS_WINDOWS) {
    fs.writeFileSync(path.join(CORE_ROOT, 'exclude_runtime.txt'), 'runtime\nnode.exe\n');
}

bundleCloudSuite();
