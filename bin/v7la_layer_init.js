#!/usr/bin/env node
/**
 * v7la_layer_init.js — UNIFIED AUDIT
 * Bagian 1: LanceDB Collections (6 koleksi)
 * Bagian 2: V7LA 5-Layer Code Compliance (kode sumber)
 *
 * Dipanggil oleh: .\l  atau  .\openclaw.ps1 v7la layer
 */

const fs = require('fs');
const path = require('path');

// ── Konfigurasi Portabilitas ──────────────────────────────────────────────────
const CORE_ROOT = process.env.V7LA_CORE_ROOT || path.resolve(__dirname, '..');
const PROJECT_ROOT = process.env.V7LA_PROJECT_ROOT || path.resolve(CORE_ROOT, '..', 'openclaw', 'lms-platform');

const CACHE_FILE = path.join(CORE_ROOT, 'vault', 'lancedb_v7la_cache.json');
const WEBAPP = path.join(PROJECT_ROOT, 'apps', 'web');
const SCHEMA = path.join(PROJECT_ROOT, 'packages', 'db', 'prisma', 'schema.prisma');
const HOOKS_DIR = path.join(WEBAPP, 'hooks');
const API_DIR = path.join(WEBAPP, 'app', 'api');
const MIDDLE = path.join(WEBAPP, 'middleware.ts');

// ── Colors ─────────────────────────────────────────────────────────────────---
const C = {
    reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
    cyan: '\x1b[36m', magenta: '\x1b[35m', yellow: '\x1b[33m',
    green: '\x1b[32m', red: '\x1b[31m', gray: '\x1b[90m', white: '\x1b[37m',
};
const OK = `${C.green}✅${C.reset}`;
const ERR = `${C.red}❌${C.reset}`;
const INF = `${C.cyan}ℹ ${C.reset}`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function readCache() {
    if (fs.existsSync(CACHE_FILE)) {
        try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch (_) { }
    }
    return {};
}
function writeCache(db) {
    try { fs.writeFileSync(CACHE_FILE, JSON.stringify(db, null, 2)); } catch (_) { }
}
function formatBytes(n) {
    return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}
function fileContains(filePath, str) {
    if (!fs.existsSync(filePath)) return false;
    return fs.readFileSync(filePath, 'utf8').includes(str);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAGIAN 1 — LanceDB Collections Audit
// ═══════════════════════════════════════════════════════════════════════════════
const COLLECTIONS = [
    { name: 'vault_knowledge', icon: '📚', layer: 'Cross-layer', desc: 'Offline docs & materi cache' },
    { name: 'proven_patterns', icon: '✅', layer: 'Layer 3 Service', desc: 'Pola kode/logic yang berhasil' },
    { name: 'failed_attempts', icon: '❌', layer: 'Layer 3 Service', desc: 'Anti-pattern guard' },
    { name: 'failed_validations', icon: '🛡️', layer: 'Layer 1 Schema', desc: 'Zod error history & hints' },
    { name: 'swr_cache', icon: '⚡', layer: 'Layer 2 Hook', desc: 'SWR offline data snapshot' },
    { name: 'security_events', icon: '🔐', layer: 'Layer 5 Edge', desc: 'Request anomaly log' },
];

function runLanceAudit() {
    console.log(`\n${C.bold}${C.cyan}┌─────────────────────────────────────────────────────┐${C.reset}`);
    console.log(`${C.bold}${C.cyan}│  BAGIAN 1 — LanceDB Collections Audit               │${C.reset}`);
    console.log(`${C.bold}${C.cyan}└─────────────────────────────────────────────────────┘${C.reset}\n`);

    const db = readCache();
    let created = 0, existing = 0;

    for (const col of COLLECTIONS) {
        const isNew = !db[col.name];
        if (isNew) { db[col.name] = []; created++; } else { existing++; }
        const status = isNew ? `${C.green}NEW   ${C.reset}` : `${C.cyan}EXISTS${C.reset}`;
        const count = (db[col.name] || []).length;
        const countStr = count > 0 ? `${C.yellow}${count} entries${C.reset}` : `${C.gray}empty${C.reset}`;
        console.log(`  ${col.icon}  [${status}]  ${C.bold}${col.name.padEnd(22)}${C.reset}  ${countStr}`);
        console.log(`         ${C.gray}${col.layer.padEnd(18)} — ${col.desc}${C.reset}`);
    }

    writeCache(db);

    const cacheSize = fs.existsSync(CACHE_FILE)
        ? formatBytes(fs.statSync(CACHE_FILE).size) : '0 B';

    const lanceScore = COLLECTIONS.length; // all always init
    console.log(`\n  ${INF} ${C.bold}${COLLECTIONS.length}/6 collections ready${C.reset}  |  Cache: ${C.cyan}${cacheSize}${C.reset}  |  Source: ${C.gray}lancedb_v7la_cache.json${C.reset}`);

    return lanceScore;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAGIAN 2 — V7LA 5-Layer Code Compliance
// ═══════════════════════════════════════════════════════════════════════════════
function runCodeAudit() {
    console.log(`\n${C.bold}${C.magenta}┌─────────────────────────────────────────────────────┐${C.reset}`);
    console.log(`${C.bold}${C.magenta}│  BAGIAN 2 — V7LA 5-Layer Code Compliance            │${C.reset}`);
    console.log(`${C.bold}${C.magenta}└─────────────────────────────────────────────────────┘${C.reset}\n`);

    const schemaContent = fs.existsSync(SCHEMA)
        ? fs.readFileSync(SCHEMA, 'utf8') : '';
    const hookFiles = fs.existsSync(HOOKS_DIR)
        ? fs.readdirSync(HOOKS_DIR) : [];
    const mwContent = fs.existsSync(MIDDLE)
        ? fs.readFileSync(MIDDLE, 'utf8') : '';

    const quizRoute = path.join(API_DIR, 'quizzes', 'route.ts');
    const quizIdRoute = path.join(API_DIR, 'quizzes', '[id]', 'route.ts');
    const genRoute = path.join(API_DIR, 'quizzes', 'generate', 'route.ts');
    const quizForm = path.join(WEBAPP, 'components', 'dashboard', 'lecturer', 'quiz', 'QuizForm.tsx');
    const quizCard = path.join(WEBAPP, 'components', 'QuizCard.tsx');
    const lanceHook = path.join(HOOKS_DIR, 'useLanceCache.ts');
    const lanceLayer = path.join(API_DIR, '_services', 'lance-layer.service.ts');
    const lanceVal = path.join(WEBAPP, 'lib', 'lance-validation.service.ts');
    const lanceCacheRoute = path.join(API_DIR, 'lance-cache', 'route.ts');

    const checks = [
        // Layer 1 — Schema
        { label: '[Schema] schema.prisma ada', ok: fs.existsSync(SCHEMA) },
        { label: '[Schema] Quiz.createdBy ada', ok: schemaContent.includes('createdBy') },
        { label: '[Schema] QuizAttempt.feedback ada', ok: schemaContent.includes('feedback') },
        { label: '[Schema] LanceValidationService ada', ok: fs.existsSync(lanceVal) },
        // Layer 2 — Hook
        { label: '[Hook]   useQuiz.ts ada', ok: hookFiles.includes('useQuiz.ts') },
        { label: '[Hook]   useLanceCache.ts ada', ok: fs.existsSync(lanceHook) },
        { label: '[Hook]   useLecturerDashboard.ts ada', ok: hookFiles.includes('useLecturerDashboard.ts') },
        // Layer 3 — Service
        { label: '[Service] POST quiz auth (403)', ok: fileContains(quizRoute, '403') },
        { label: '[Service] POST quiz simpan createdBy', ok: fileContains(quizRoute, 'createdBy') },
        { label: '[Service] DELETE quiz auth check', ok: fileContains(quizIdRoute, '403') },
        { label: '[Service] Generate smart distractors', ok: fileContains(genRoute, 'sort(() => Math.random') },
        { label: '[Service] LanceLayerService ada', ok: fs.existsSync(lanceLayer) },
        { label: '[Service] lance-cache API route ada', ok: fs.existsSync(lanceCacheRoute) },
        // Layer 4 — UI
        { label: '[UI]     QuizForm.tsx ada', ok: fs.existsSync(quizForm) },
        { label: '[UI]     QuizCard.tsx ada', ok: fs.existsSync(quizCard) },
        // Layer 5 — Edge
        { label: '[Edge]   middleware.ts ada', ok: fs.existsSync(MIDDLE) },
        { label: '[Edge]   Auth guard (lms_user_id)', ok: mwContent.includes('lms_user_id') },
        { label: '[Edge]   Role guard (lms_user_role)', ok: mwContent.includes('lms_user_role') },
        { label: '[Edge]   STUDENT redirect ke /student', ok: mwContent.includes("pathname = '/student'") },
        { label: '[Edge]   Security header x-lance-event', ok: mwContent.includes('x-lance-security-event') },
    ];

    let passed = 0;
    const layers = {
        Schema: checks.filter(c => c.label.includes('[Schema]')),
        Hook: checks.filter(c => c.label.includes('[Hook]')),
        Service: checks.filter(c => c.label.includes('[Service]')),
        UI: checks.filter(c => c.label.includes('[UI]')),
        Edge: checks.filter(c => c.label.includes('[Edge]')),
    };

    const layerIcons = { Schema: '🛡️ ', Hook: '⚡', Service: '⚙️ ', UI: '🎨', Edge: '🔐' };

    for (const [layerName, layerChecks] of Object.entries(layers)) {
        const layerPass = layerChecks.filter(c => c.ok).length;
        const layerTotal = layerChecks.length;
        const layerOk = layerPass === layerTotal;
        const icon = layerIcons[layerName];
        console.log(`  ${icon} ${C.bold}Layer ${layerName}${C.reset}  ${layerOk ? C.green : C.yellow}(${layerPass}/${layerTotal})${C.reset}`);
        for (const c of layerChecks) {
            console.log(`     ${c.ok ? OK : ERR} ${C.gray}${c.label.replace(/\[\w+\]\s+/, '')}${C.reset}`);
            if (c.ok) passed++;
        }
    }

    return { passed, total: checks.length };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — Run both audits + unified summary
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
    console.log(`\n${C.bold}${C.white}╔═════════════════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.bold}${C.white}║   V7LA UNIFIED AUDIT — LanceDB + Code Compliance  ║${C.reset}`);
    console.log(`${C.bold}${C.white}╚═════════════════════════════════════════════════════╝${C.reset}`);

    // Run both sections
    const lanceReady = runLanceAudit();
    const { passed, total } = runCodeAudit();
    const failed = total - passed;

    // Final summary
    const pct = Math.round((passed / total) * 100);
    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));

    console.log(`\n${C.bold}${C.white}╔═════════════════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.bold}${C.white}║  RINGKASAN AUDIT                                   ║${C.reset}`);
    console.log(`${C.bold}${C.white}╠═════════════════════════════════════════════════════╣${C.reset}`);
    console.log(`${C.bold}${C.white}║${C.reset}  LanceDB Collections : ${C.green}6/6 ready${C.reset}                       ${C.white}║${C.reset}`);
    console.log(`${C.bold}${C.white}║${C.reset}  Code Compliance     : ${pct >= 90 ? C.green : pct >= 70 ? C.yellow : C.red}${passed}/${total} checks (${pct}%)${C.reset}               ${C.white}║${C.reset}`);
    console.log(`${C.bold}${C.white}║${C.reset}  ${C.cyan}[${bar}] ${pct}%${C.reset}              ${C.white}║${C.reset}`);
    console.log(`${C.bold}${C.white}╚═════════════════════════════════════════════════════╝${C.reset}`);

    if (failed === 0) {
        console.log(`\n  ${C.green}${C.bold}🎯 FULL COMPLIANCE — Semua layer bersih dan LanceDB ready!${C.reset}\n`);
        process.exit(0);
    } else {
        console.log(`\n  ${C.yellow}⚠  ${failed} code check gagal — perbaiki sebelum commit.${C.reset}`);
        console.log(`  ${C.gray}Tip: jalankan .\\c untuk detail per-layer, atau perbaiki file yang ❌${C.reset}\n`);
        process.exit(1);
    }
}

main();
