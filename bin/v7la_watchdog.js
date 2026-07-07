#!/usr/bin/env node
/**
 * v7la_watchdog.js — V7LA Autonomous Monitor (Devin Pilot)
 * Polls for system failures and triggers repairs automatically.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CORE_ROOT = process.env.V7LA_CORE_ROOT || path.resolve(__dirname, '..');
const PROJECT_ROOT = process.env.V7LA_PROJECT_ROOT || path.resolve(CORE_ROOT, '..', 'openclaw');
const CACHE_FILE = path.join(CORE_ROOT, 'vault', 'lancedb_v7la_cache.json');
const SCHEMA_PATH = path.join(PROJECT_ROOT, 'lms-platform', 'packages', 'db', 'prisma', 'schema.prisma');

const C = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    bold: '\x1b[1m',
    reset: '\x1b[0m'
};

console.log(`${C.bold}${C.magenta}🛰️  V7LA AUTO-PILOT WATCHDOG STARTED${C.reset}`);
console.log(`  Monitoring: ${C.cyan}${PROJECT_ROOT}${C.reset}`);
console.log(`  Interval  : 10 seconds\n`);

function triggerRepair(reason) {
    console.log(`\n${C.red}⚠️ ALERT: ${reason}${C.reset}`);
    console.log(`  ${C.yellow}Devin Pilot taking control...${C.reset}`);

    const repairTask = `[AUTO-PILOT REPAIR] Internal watchdog detected critical failure: ${reason}`;
    const nps = path.join(CORE_ROOT, 'core', 'n.ps1');

    const proc = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', nps, repairTask], { stdio: 'inherit' });
    proc.on('close', (code) => {
        console.log(`\n  ${C.green}✅ Auto-Repair attempt finished (Code: ${code}). Check nexus_prompt_output.md.${C.reset}\n`);
    });
}

setInterval(() => {
    // Check 1: Schema Integrity
    if (!fs.existsSync(SCHEMA_PATH)) {
        triggerRepair("Prisma Schema Missing or Deleted");
    }

    // Check 2: Vault Connectivity
    if (!fs.existsSync(CACHE_FILE)) {
        console.log(`${C.red}✗ WATCHDOG ERROR: LanceDB Vault Disappeared!${C.reset}`);
    }

    // Future: Check for specific "FAIL" markers in local build logs
}, 10000); // 10s intervals
