#!/usr/bin/env node
/**
 * v7la_backup.js — V7LA Vault Backup Engine
 * Creates a timestamped backup of the LanceDB cache and protocol manifest.
 */

const fs = require('fs');
const path = require('path');

const CORE_ROOT = process.env.V7LA_CORE_ROOT || path.resolve(__dirname, '..');
const PROJECT_ROOT = process.env.V7LA_PROJECT_ROOT || path.resolve(CORE_ROOT, '..', 'openclaw');
const VAULT_DIR = PROJECT_ROOT;
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups');
const CACHE_FILE = path.join(PROJECT_ROOT, 'lancedb_v7la_cache.json');
const PROTOCOL_FILE = path.join(PROJECT_ROOT, 'v7la_protocol.json');

const C = {
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
    reset: '\x1b[0m'
};

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `v7la_vault_backup_${timestamp}`);
fs.mkdirSync(backupPath);

console.log(`\n  ${C.bold}${C.cyan}📦 V7LA VAULT BACKUP ENGINE — v1.7.0${C.reset}\n`);

try {
    if (fs.existsSync(CACHE_FILE)) {
        fs.copyFileSync(CACHE_FILE, path.join(backupPath, 'lancedb_v7la_cache.json'));
        console.log(`  ${C.green}✅ [DONE]${C.reset} LanceDB Cache backed up.`);
    }
    if (fs.existsSync(PROTOCOL_FILE)) {
        fs.copyFileSync(PROTOCOL_FILE, path.join(backupPath, 'v7la_protocol.json'));
        console.log(`  ${C.green}✅ [DONE]${C.reset} Protocol Manifest backed up.`);
    }

    console.log(`\n  ${C.bold}Backup Location:${C.reset}`);
    console.log(`  ${backupPath}\n`);
    console.log(`  ${C.green}✨ Vault Protected Successfully.${C.reset}\n`);
} catch (error) {
    console.error(`  ❌ Backup failed: ${error.message}`);
    process.exit(1);
}
