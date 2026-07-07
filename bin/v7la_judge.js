#!/usr/bin/env node
/**
 * v7la_judge.js — V7LA Nexus Draft Manager
 * Promotes successful drafts to proven_patterns or demotes failures.
 * Usage: node v7la_judge.js [ok | fail | clear | list | audit | repair]
 * Commands:
 *  [1] ok [idx]   — Promote draft to proven_patterns
 *  [2] fail [idx] — Demote draft to failed_attempts
 *  [3] Auto-Repair mode (REPAIR logic)
 *  [4] Doc-Audit (Copilot Strategy)
 */

const fs = require('fs');
const path = require('path');

// ── Konfigurasi Portabilitas ──────────────────────────────────────────────────
const PROJECT_ROOT = process.env.V7LA_PROJECT_ROOT || path.resolve(__dirname, '..');
const CACHE_FILE_ROOT = path.join(PROJECT_ROOT, 'lancedb_v7la_cache.json');
const CACHE_FILE_VAULT = path.join(PROJECT_ROOT, 'vault', 'lancedb_v7la_cache.json');
const CACHE_FILE = fs.existsSync(CACHE_FILE_VAULT) ? CACHE_FILE_VAULT : CACHE_FILE_ROOT;
const PROTOCOL_FILE = path.join(PROJECT_ROOT, 'v7la_protocol.json');
const NSS_PATH = path.join(PROJECT_ROOT, 'nexus_state.json');

// ── Read Protocol Manifest ─────────────────────────
let PROTOCOL = { version: "1.4.2", codename: "STABLE" };
if (fs.existsSync(PROTOCOL_FILE)) {
    try { PROTOCOL = JSON.parse(fs.readFileSync(PROTOCOL_FILE, 'utf8')); } catch (_) { }
}

const C = {
    reset: '\x1b[0m', bold: '\x1b[1m', cyan: '\x1b[36m',
    green: '\x1b[32m', red: '\x1b[31m', gray: '\x1b[90m', yellow: '\x1b[33m'
};

const action = process.argv[2] || 'list';

function readCache() {
    if (fs.existsSync(CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
    return { vault_knowledge: [], proven_patterns: [], failed_attempts: [], draft_sessions: [] };
}

function writeCache(db) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(db, null, 2));
}

function runJudge() {
    const db = readCache();
    const drafts = db.draft_sessions || [];

    if (action === 'list') {
        console.log(`\n${C.bold}⚖️  V7LA NEXUS JUDGE - ACTIVE DRAFTS${C.reset}`);
        if (drafts.length === 0) {
            console.log(`${C.gray}  No pending drafts found.${C.reset}\n`);
            return;
        }
        drafts.forEach((d, i) => {
            console.log(`${C.cyan}[${i}] ID: ${d.id}${C.reset}`);
            console.log(`    Task: ${C.yellow}${d.task}${C.reset}`);
            console.log(`    Time: ${C.gray}${new Date(d.timestamp).toLocaleString()}${C.reset}\n`);
        });
        console.log(`Commands: j ok [idx], j fail [idx], j clear, j audit [idx]`);
    }
    else if (action === 'audit') { // --- NEW: COPILOT DOCUMENTATION GUARD ---
        const idx = parseInt(process.argv[3] || '0');
        if (!drafts[idx]) return console.log(`${C.red}Invalid index.${C.reset}`);
        const draft = drafts[idx];

        console.log(`\n${C.bold}🔍 V7LA NEXUS JUDGE - DOCUMENTATION AUDIT${C.reset}`);
        console.log(`  Draft ID: ${C.cyan}${draft.id}${C.reset}`);
        console.log(`  Task: ${C.yellow}${draft.task}${C.reset}`);

        const isDocOk = (draft.prompt && (draft.prompt.includes('/**') || draft.prompt.includes('JSDoc')));
        if (!isDocOk) {
            console.log(`  ${C.yellow}⚠ Warning: Missing JSDoc/TSDoc. Copilot audit suggests adding documentation.${C.reset}`);
        } else {
            console.log(`  ${C.green}✓ Documentation Audit Passed.${C.reset}`);
        }
        console.log(''); // Add a newline for better readability
    }
    else if (action === 'ok') {
        const arg = process.argv[3] || '0';

        if (arg === 'all') {
            if (drafts.length === 0) return console.log(`${C.gray}No drafts to promote.${C.reset}`);
            const count = drafts.length;
            while (drafts.length > 0) {
                const winningDraft = drafts.shift();
                db.proven_patterns.push({
                    vector: winningDraft.vector,
                    content: `Success Pattern: ${winningDraft.task}`,
                    metadata: JSON.stringify({ source: 'nexus-draft', ts: Date.now() })
                });
            }
            writeCache(db);
            console.log(`${C.green}✅ All ${count} drafts promoted to PROVEN_PATTERNS.${C.reset}`);
        } else {
            const idx = parseInt(arg);
            if (isNaN(idx) || !drafts[idx]) return console.log(`${C.red}Invalid index.${C.reset}`);

            const winningDraft = drafts.splice(idx, 1)[0];
            db.proven_patterns.push({
                vector: winningDraft.vector,
                content: `Success Pattern: ${winningDraft.task}`,
                metadata: JSON.stringify({ source: 'nexus-draft', ts: Date.now() })
            });
            writeCache(db);
            console.log(`${C.green}✅ Draft promoted to PROVEN_PATTERNS.${C.reset}`);
        }
    }
    else if (action === 'fail') {
        const idx = parseInt(process.argv[3] || '0');
        if (!drafts[idx]) return console.log(`${C.red}Invalid index.${C.reset}`);

        const failingDraft = drafts.splice(idx, 1)[0];
        db.failed_attempts.push({
            vector: failingDraft.vector,
            content: `Failed Attempt: ${failingDraft.task}`,
            metadata: JSON.stringify({ source: 'nexus-draft', ts: Date.now() })
        });
        writeCache(db);
        console.log(`${C.red}❌ Draft moved to FAILED_ATTEMPTS.${C.reset}`);
    }
    else if (action === 'clear') {
        db.draft_sessions = [];
        writeCache(db);
        console.log(`${C.gray}Draft layer cleared.${C.reset}`);
    }
    else if (action === 'repair') {
        console.log(`\n${C.bold}${C.yellow}🛠️  V7LA AUTO-REPAIR WATCHDOG (v1.6.0 - OMNI-SUPREMACY)${C.reset}`);

        const NSS_PATH = path.join(ROOT, 'nexus_state.json');
        let lastTask = "Unknown task";
        if (fs.existsSync(NSS_PATH)) {
            const state = JSON.parse(fs.readFileSync(NSS_PATH, 'utf8'));
            lastTask = state.last_task || lastTask;
        }

        console.log(`  ${C.gray}Detecting system state...${C.reset}`);
        const errors = [];
        if (!fs.existsSync(path.join(PROJECT_ROOT, 'packages', 'db', 'prisma', 'schema.prisma'))) errors.push("Prisma Schema Missing");
        if (!fs.existsSync(path.join(PROJECT_ROOT, 'apps', 'web', '.next'))) errors.push("Build Artifacts Missing");

        if (errors.length === 0) {
            console.log(`  ${C.green}✅ No critical errors detected. System is healthy.${C.reset}`);
            return;
        }

        console.log(`  ${C.red}✗ Errors found: ${errors.join(', ')}${C.reset}`);
        const repairTask = `[REPAIR LOOP] Fix the following errors: ${errors.join(' & ')}. Context: Terakhir mengerjakan "${lastTask}"`;

        console.log(`  ${C.cyan}🚀 Launching Repair Pipeline...${C.reset}`);
        const { spawn } = require('child_process');
        const nps = path.join(CORE_ROOT, 'core', 'n.ps1');

        // Trigger n.ps1 with the repair task
        console.log(`  ${C.gray}Running: .\\n "${repairTask}"${C.reset}\n`);
        const proc = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', nps, repairTask], { stdio: 'inherit' });
        proc.on('close', (code) => {
            console.log(`\n  ${C.green}✅ Repair draft generated (Code: ${code}). Cek nexus_prompt_output.md.${C.reset}\n`);
        });
    }
}

runJudge();
