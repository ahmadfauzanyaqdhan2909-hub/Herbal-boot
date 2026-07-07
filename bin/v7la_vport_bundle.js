#!/usr/bin/env node
/**
 * v7la_vport_bundle.js
 * Automates the assembly of the V7LA-ULTIMATE-PORTABLE Suite.
 * Collects Node runtime, OpenClaw, OpenCode, and all V7LA core scripts.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CORE_ROOT = process.env.V7LA_CORE_ROOT || path.resolve(__dirname, '..');
const SUITE_NAME = 'V7LA-PORTABLE-SUITE';
const SUITE_PATH = path.join(CORE_ROOT, SUITE_NAME);

// ANSI colors
const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
};

function header(title) {
    console.log(`\n${C.bold}${C.magenta}╔${'═'.repeat(60)}╗${C.reset}`);
    console.log(`${C.bold}${C.magenta}║  ${title.padEnd(58)}║${C.reset}`);
    console.log(`${C.bold}${C.magenta}╚${'═'.repeat(60)}╝${C.reset}\n`);
}

async function bundleSuite() {
    header('V7LA-ULTIMATE-PORTABLE SUITE GENERATOR v1.7.0');

    try {
        // [1] Ensure SUITE Folder Structure (Non-Destructive for In-Use Folders)
        console.log(`  ${C.cyan}⟳${C.reset} Synchronizing Suite Structure...`);
        const dirs = [SUITE_PATH, path.join(SUITE_PATH, 'runtime'), path.join(SUITE_PATH, 'vault'), path.join(SUITE_PATH, 'node_modules')];
        dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d); });

        // [2] Copy "Senjata" (Binaries & Runtime)
        console.log(`  ${C.cyan}⟳${C.reset} Packing Node.js Runtime...`);
        const nodeSrc = path.join(CORE_ROOT, 'lms-platform', 'node.exe');
        if (fs.existsSync(nodeSrc)) {
            fs.copyFileSync(nodeSrc, path.join(SUITE_PATH, 'runtime', 'node.exe'));
        }

        console.log(`  ${C.cyan}⟳${C.reset} Packing OpenClaw...`);
        const openClawSrc = path.join(CORE_ROOT, 'OpenClaw.exe');
        if (fs.existsSync(openClawSrc)) {
            fs.copyFileSync(openClawSrc, path.join(SUITE_PATH, 'OpenClaw.exe'));
        }

        // [3] Copy Core Scripts (Bin)
        console.log(`  ${C.cyan}⟳${C.reset} Packing Core V7LA Scripts (Bin)...`);
        execSync(`xcopy "${path.join(CORE_ROOT, 'bin')}" "${path.join(SUITE_PATH, 'bin')}" /I /Y /E`);

        // [4] Copy LanceDB & dependencies
        console.log(`  ${C.cyan}⟳${C.reset} Packing Offline Intelligence (@lancedb)...`);
        const lancedbSrc = path.join(CORE_ROOT, 'v7la-portable-test', 'node_modules');
        if (fs.existsSync(lancedbSrc)) {
            // Only copy @lancedb and specific dependencies if needed, or just all node_modules from the test env
            execSync(`xcopy "${path.join(lancedbSrc, '@lancedb')}" "${path.join(SUITE_PATH, 'node_modules', '@lancedb')}" /I /Y /E`);
            // Copy dependencies like apache-arrow, etc.
            const deps = ['apache-arrow', 'flatbuffers', 'undici-types'];
            deps.forEach(d => {
                const dPath = path.join(lancedbSrc, d);
                if (fs.existsSync(dPath)) {
                    execSync(`xcopy "${dPath}" "${path.join(SUITE_PATH, 'node_modules', d)}" /I /Y /E`);
                }
            });
        }

        // [5] Copy Master Vault Cache & Protocol
        console.log(`  ${C.cyan}⟳${C.reset} Packing Knowledge Vault & Protocol...`);
        const vaultSrc = path.join(CORE_ROOT, 'lancedb_v7la_cache.json');
        if (fs.existsSync(vaultSrc)) {
            fs.copyFileSync(vaultSrc, path.join(SUITE_PATH, 'vault', 'lancedb_v7la_cache.json'));
        }
        const protocolSrc = path.join(CORE_ROOT, 'v7la_protocol.json');
        if (fs.existsSync(protocolSrc)) {
            fs.copyFileSync(protocolSrc, path.join(SUITE_PATH, 'vault', 'v7la_protocol.json'));
        }

        // [6] Copy Core Wrapper Files
        console.log(`  ${C.cyan}⟳${C.reset} Packing Script Wrappers...`);
        fs.copyFileSync(path.join(CORE_ROOT, 'v7la-core.ps1'), path.join(SUITE_PATH, 'v7la-core.ps1'));

        const bats = ['v.bat', 'n.bat', 'm.bat', 'rr.bat', 'b.bat', 'j.bat', 'vp.bat'];
        bats.forEach(b => {
            const batSrc = path.join(CORE_ROOT, b);
            if (fs.existsSync(batSrc)) fs.copyFileSync(batSrc, path.join(SUITE_PATH, b));
        });

        // [7] Copy V7LA-VPORT-TEMPLATE
        console.log(`  ${C.cyan}⟳${C.reset} Packing Project Generator Template...`);
        execSync(`xcopy "${path.join(CORE_ROOT, 'v7la-vport-template')}" "${path.join(SUITE_PATH, 'v7la-vport-template')}" /I /Y /E`);

        // [8] Create Master Launcher (V7LA-START-SUITE.bat)
        console.log(`  ${C.cyan}⟳${C.reset} Generating Master Launcher...`);
        const launcherContent = `@echo off\\nsetlocal\\nset \"V7LA_PORTABLE_ROOT=%~dp0\"\\nset \"PATH=%V7LA_PORTABLE_ROOT%runtime;%PATH%\"\\nset \"V7LA_PROJECT_ROOT=%V7LA_PORTABLE_ROOT%\"\\n\\necho.\\necho   =============================================\\necho   V7LA-PORTABLE-SUITE v1.7.0 (AUTONOMOUS-PRIME)\\necho   =============================================\\necho   Runtime  : %V7LA_PORTABLE_ROOT%runtime\\\\node.exe\\necho   Vault    : %V7LA_PORTABLE_ROOT%vault\\necho   Interface: %V7LA_PORTABLE_ROOT%OpenClaw.exe\\necho.\\n\\n:: Launch the main status dashboard\\npowershell -NoProfile -ExecutionPolicy Bypass -Command \"\u0026 { . '%V7LA_PORTABLE_ROOT%v7la-core.ps1'; v }\"\\n\\necho.\\necho   Sistem Siaga, Pak Bos! 🛡️✨🚀\\necho.\\n:: [V7LA-AUTONOMY-BYPASS]\\n`;
        fs.writeFileSync(path.join(SUITE_PATH, 'V7LA-START-SUITE.bat'), launcherContent);

        console.log(`\n  ${C.green}✅ V7LA-ULTIMATE-PORTABLE assembled successfully!${C.reset}`);
        console.log(`  ${C.bold}Folder: ${SUITE_PATH}${C.reset}\n`);

    } catch (error) {
        console.error(`\n  ${C.bold}\x1b[31m❌ Assembly Failed:${C.reset}`, error.message);
    }
}

bundleSuite();
