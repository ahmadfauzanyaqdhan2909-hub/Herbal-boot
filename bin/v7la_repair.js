#!/usr/bin/env node
/**
 * v7la_repair.js — V7LA Auto-Repair Loop (Devin Strategy)
 * Monitors terminal output / build logs and generates repair drafts.
 */

const fs = require('fs');
const path = require('path');

const CORE_ROOT = process.env.V7LA_CORE_ROOT || path.resolve(__dirname, '..');
const PROJECT_ROOT = process.env.V7LA_PROJECT_ROOT || path.resolve(__dirname, '..');
const CACHE_FILE_ROOT = path.join(PROJECT_ROOT, 'lancedb_v7la_cache.json');
const CACHE_FILE_VAULT = path.join(PROJECT_ROOT, 'vault', 'lancedb_v7la_cache.json');
const CACHE_FILE = fs.existsSync(CACHE_FILE_VAULT) ? CACHE_FILE_VAULT : CACHE_FILE_ROOT;

const C = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
    reset: '\x1b[0m'
};

async function runRepair(errorLog) {
    console.log(`\n${C.bold}${C.cyan}🔧 V7LA AUTO-REPAIR WATCHDOG (Devin Mode)${C.reset}`);

    if (!errorLog) {
        console.log(`  ${C.yellow}No error log provided. Scanning recent terminal history...${C.reset}`);
        // In a real scenario, we might read a specific log file
        return;
    }

    console.log(`  ${C.bold}Status:${C.reset} Error Detected. Analyzing patterns...`);

    // Simulate pattern matching for common errors
    let fixSuggestion = "General fix suggested based on project context.";
    if (errorLog.includes('PrismaClientKnownRequestError')) {
        fixSuggestion = "Detected Prisma sync error. Suggestion: run 'npx prisma generate' and verify schema relations.";
    } else if (errorLog.includes('Module not found')) {
        fixSuggestion = "Detected missing dependency. Suggestion: verify package.json and run 'npm install'.";
    }

    let db = { draft_sessions: [] };
    if (fs.existsSync(CACHE_FILE)) {
        try {
            db = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8').replace(/^\uFEFF/, ''));
        } catch (e) {
            console.log(`  ${C.yellow}⚠️  Warning: Could not read Vault for repair logging.${C.reset}`);
        }
    }

    const repairDraft = {
        id: `REPAIR-${Date.now()}`,
        task: "AUTOMATIC REPAIR",
        error: errorLog.substring(0, 200),
        suggestion: fixSuggestion,
        status: 'PENDING',
        timestamp: new Date().toISOString()
    };

    db.draft_sessions.push(repairDraft);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(db, null, 2));

    console.log(`  ${C.green}✅ Repair Draft Created (ID: ${repairDraft.id})${C.reset}`);
    console.log(`  ${C.cyan}→ Suggestion: ${fixSuggestion}${C.reset}\n`);
}

const args = process.argv.slice(2).join(' ');
runRepair(args);
