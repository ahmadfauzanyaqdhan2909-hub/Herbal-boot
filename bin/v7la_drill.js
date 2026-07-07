#!/usr/bin/env node
/**
 * v7la_drill.js — V7LA Quad-Lock Drill Engine
 * Verifies the 4 layers of persistence to ensure system stability.
 */

const fs = require('fs');
const path = require('path');

const CORE_ROOT = process.env.V7LA_CORE_ROOT || path.resolve(__dirname, '..');
const PROJECT_ROOT = process.env.V7LA_PROJECT_ROOT || path.resolve(CORE_ROOT, '..', 'openclaw');
const PROTOCOL_FILE = path.join(PROJECT_ROOT, 'v7la_protocol.json');
const FLAG_FILE = path.join(PROJECT_ROOT, '.v7la-version-flag');
const CACHE_FILE = path.join(PROJECT_ROOT, 'lancedb_v7la_cache.json');

const C = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
    reset: '\x1b[0m'
};

console.log(`\n  ${C.bold}${C.cyan}🛡️ V7LA QUAD-LOCK DRILL — PERSISTENCE VERIFICATION${C.reset}\n`);

let checks = [
    { name: "LOCK 1: Protocol Manifest", path: PROTOCOL_FILE, icon: "📄" },
    { name: "LOCK 2: Version Flag File", path: FLAG_FILE, icon: "🚩" },
    { name: "LOCK 3: Vault Data Anchor", path: CACHE_FILE, icon: "⚓" }
];

let failedCount = 0;

checks.forEach(check => {
    const exists = fs.existsSync(check.path);
    if (exists) {
        console.log(`  ${C.green}✅ [MATCH]${C.reset} ${check.icon} ${check.name}`);
    } else {
        console.log(`  ${C.red}❌ [MISSING]${check.icon} ${check.name}${C.reset}`);
        failedCount++;
    }
});

// LOCK 4: Script Sync Check
const binFiles = fs.readdirSync(path.join(CORE_ROOT, 'bin')).filter(f => f.startsWith('v7la_'));
const sourceBin = path.join(PROJECT_ROOT, 'bin');
let syncFail = false;

if (fs.existsSync(sourceBin)) {
    binFiles.forEach(file => {
        const sourcePath = path.join(sourceBin, file);
        if (!fs.existsSync(sourcePath)) syncFail = true;
    });
} else {
    syncFail = true;
}

if (!syncFail) {
    console.log(`  ${C.green}✅ [MATCH]${C.reset} 🔄 LOCK 4: Core Script Synchronization`);
} else {
    console.log(`  ${C.red}❌ [SYSERR] 🔄 LOCK 4: Script Sync Discrepancy Found${C.reset}`);
    failedCount++;
}

console.log('\n  ' + '─'.repeat(50));
if (failedCount === 0) {
    console.log(`\n  ${C.bold}${C.green}✨ SYSTEM STATUS: 100% PERSISTENT${C.reset}`);
    console.log(`  v1.7.0 (AUTONOMOUS-PRIME) — Kasta sistem tetap terjaga.\n`);
} else {
    console.log(`\n  ${C.bold}${C.red}⚠️ ALERT: PERSISTENCE COMPROMISED (${failedCount} Failures)${C.reset}`);
    console.log(`  Harap periksa integritas UHV-CORE-1.5 segera.\n`);
}
