#!/usr/bin/env node
/**
 * v7la_nexus_pipeline.js
 * Full Pipeline: LanceDB → (Context7 jika perlu) → OpenCode context → OpenClaw execution
 * Dipanggil oleh: .\n.ps1 "task" atau .\openclaw.ps1 v7la nexus "task"
 */

const fs = require('fs');
const path = require('path');

// ── Konfigurasi Portabilitas ──────────────────────────────────────────────────
const CORE_ROOT = process.env.V7LA_CORE_ROOT || path.resolve(__dirname, '..');
const PROJECT_ROOT = process.env.V7LA_PROJECT_ROOT || path.resolve(CORE_ROOT, '..', 'openclaw');

const VAULT_JSON_PATH = path.join(CORE_ROOT, 'vault', 'lancedb_v7la_cache.json');
const ROOT_JSON_PATH = path.join(CORE_ROOT, 'lancedb_v7la_cache.json');
const CACHE_FILE = fs.existsSync(VAULT_JSON_PATH) ? VAULT_JSON_PATH : ROOT_JSON_PATH;

const VAULT_JSON = CACHE_FILE;
const CONTEXT = path.join(PROJECT_ROOT, '.vibe_context.json');
const PROTOCOL_FILE = fs.existsSync(path.join(CORE_ROOT, 'vault', 'v7la_protocol.json'))
    ? path.join(CORE_ROOT, 'vault', 'v7la_protocol.json')
    : path.join(CORE_ROOT, 'v7la_protocol.json');
const NSS_PATH = path.join(PROJECT_ROOT, 'nexus_state.json');

// ANSI colors
const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
};

const sym = {
    ok: `${C.green}✅${C.reset}`,
    warn: `${C.yellow}⚠ ${C.reset}`,
    run: `${C.cyan}⟳ ${C.reset}`,
    brain: `${C.magenta}🧠${C.reset}`,
    bolt: `${C.yellow}⚡${C.reset}`,
    target: `${C.cyan}🎯${C.reset}`,
    miss: `${C.gray}◌ ${C.reset}`,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function header(title) {
    console.log(`\n${C.bold}${C.magenta}╔${'═'.repeat(50)}╗${C.reset}`);
    console.log(`${C.bold}${C.magenta}║  ${title.padEnd(48)}║${C.reset}`);
    console.log(`${C.bold}${C.magenta}╚${'═'.repeat(50)}╝${C.reset}\n`);
}

function step(n, total, label) {
    const bar = Array(total).fill('─').map((_, i) => i < n ? '▶' : '─').join('');
    console.log(`  ${C.gray}[${bar}]${C.reset} ${C.bold}${label}${C.reset}`);
}

function indent(text, prefix = '    ') {
    return text.split('\n').map(l => prefix + l).join('\n');
}

// ── Simple hash-embedding ──────────────────────────────────────────────────
function generateEmbedding(text, dim = 384) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }
    return Array.from({ length: dim }, (_, i) => {
        const val = Math.sin(hash + i) * 10000;
        return val - Math.floor(val);
    });
}

function cosineSimilarity(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

// ── Read Protocol Manifest ─────────────────────────
let PROTOCOL = { version: "1.4.2", codename: "STABLE" };
if (fs.existsSync(PROTOCOL_FILE)) {
    try { PROTOCOL = JSON.parse(fs.readFileSync(PROTOCOL_FILE, 'utf8')); } catch (_) { }
}

function readCache() {
    if (fs.existsSync(CACHE_FILE)) {
        try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch (_) { }
    }
    return { vault_knowledge: [], proven_patterns: [], failed_attempts: [], draft_sessions: [], design_bridge: [] };
}

function writeCache(db) {
    try { fs.writeFileSync(CACHE_FILE, JSON.stringify(db, null, 2)); } catch (_) { }
}

function semanticSearch(collection, queryVec, topK = 3) {
    if (!Array.isArray(collection)) return [];
    return collection
        .filter(entry => entry && Array.isArray(entry.vector)) // Safety check
        .map(entry => ({
            ...entry,
            score: cosineSimilarity(queryVec, entry.vector)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .filter(r => r.score > 0.2);
}

// ── Context7 stub ──────────────────────────────────────────────────────────
function mockContext7Lookup(task) {
    const keywords = task.toLowerCase().match(/\b\w{4,}\b/g) || [];
    return {
        source: 'Context7-Stub',
        topic: keywords.slice(0, 3).join(', '),
        docs_url: `https://context7.ai/search?q=${encodeURIComponent(task)}`,
        snippet: `Dokumentasi relevan untuk: "${task}". Lihat Context7 untuk referensi library terbaru.`
    };
}

// ── Main Pipeline ─────────────────────────────────────────────────────────────
async function runNexusPipeline(task) {
    header('V7LA NEXUS PIPELINE v1.7.0 — AUTONOMOUS-PRIME');

    if (!task || task.trim() === '') {
        console.log(`  ${sym.warn} Tidak ada task. Usage: n "deskripsi task Anda"\n`);
        process.exit(0);
    }

    console.log(`  ${sym.target} Task: ${C.bold}${C.yellow}${task}${C.reset}\n`);

    if (fs.existsSync(NSS_PATH)) {
        try {
            const state = JSON.parse(fs.readFileSync(NSS_PATH, 'utf8'));
            state.last_task = task;
            state.status = 'IN PROGRESS';
            state.last_updated = new Date().toISOString();
            fs.writeFileSync(NSS_PATH, JSON.stringify(state, null, 2));
        } catch (e) { }
    }

    const queryVec = generateEmbedding(task);
    const db = readCache();
    if (!db.draft_sessions) db.draft_sessions = [];
    if (!db.design_bridge) db.design_bridge = [];

    const report = { task, timestamp: new Date().toISOString() };

    // ─── STEP 0: Architect Mode (Deep Workspace Scan) ────────────────────────
    step(0, 7, 'Architect Mode  →  Deep Workspace Scan (Prisma + Structure)');
    const SCHEMA_PATH = path.join(PROJECT_ROOT, 'lms-platform', 'packages', 'db', 'prisma', 'schema.prisma');
    let schemaContext = "";
    if (fs.existsSync(SCHEMA_PATH)) {
        console.log(`  ${sym.ok} Schema terdeteksi — Injeksi model ke prompt context`);
        schemaContext = fs.readFileSync(SCHEMA_PATH, 'utf8');
        report.architect_scan = true;
    } else {
        console.log(`  ${sym.warn} Schema tidak ditemukan — Melewati Architect Scan`);
        report.architect_scan = false;
    }

    let workspaceStructure = "";
    const keyDirs = ['.', 'apps/web/app', 'apps/web/components', 'packages/db/prisma'];
    keyDirs.forEach(dir => {
        const fullPath = path.join(PROJECT_ROOT, 'lms-platform', dir);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath).slice(0, 10);
            workspaceStructure += `\nDirectory: ${dir}\n - ${files.join('\n - ')}\n`;
        }
    });

    // ─── STEP 0.5: Windsurf Deep Context ─────────────────────
    step(0.5, 7, 'Windsurf Deep Context  →  Dependency Graph Audit');
    let designBridgeContext = "";
    if (db.design_bridge && db.design_bridge.entities) {
        console.log(`  ${sym.ok} Design Bridge terdeteksi — ${db.design_bridge.entity_count} nodes tersinkronisasi`);
        designBridgeContext = "### 🔗 Design Bridge (Dependency Graph)\n";
        designBridgeContext += "Entities:\n" + db.design_bridge.entities.map(e => ` - ${e.name} (${e.type})`).join('\n') + "\n";
        designBridgeContext += "\nRelations:\n" + db.design_bridge.relations.map(r => ` - ${r.from} --[${r.type}]--> ${r.to}`).join('\n');
    } else {
        console.log(`  ${sym.miss} Design Bridge kosong — Gunakan .\\l untuk sinkronisasi graf`);
    }

    // ─── STEP 1: LanceDB vault_knowledge ────────────────
    step(1, 7, 'LanceDB vault_knowledge  →  Semantic search');
    const vaultHits = semanticSearch(db.vault_knowledge, queryVec, 3);

    let vaultContext = '';
    if (vaultHits.length > 0) {
        console.log(`  ${sym.ok} Cache HIT — ${vaultHits.length} dokumen relevan ditemukan`);
        vaultHits.forEach(h => {
            vaultContext += h.content + '\n';
        });
        report.vault_hit = true;
    } else {
        console.log(`  ${sym.miss} Cache MISS — LanceDB vault kosong atau tidak relevan`);
        report.vault_hit = false;
    }

    // ─── STEP 2: LanceDB proven_patterns ─────────────────────────────────────
    step(2, 7, 'LanceDB proven_patterns  →  Inject pola sukses');
    const patternHits = semanticSearch(db.proven_patterns, queryVec, 2);

    let patternContext = '';
    if (patternHits.length > 0) {
        console.log(`  ${sym.ok} ${patternHits.length} proven pattern ditemukan (Reusing knowledge ✅)`);
        patternHits.forEach(h => {
            console.log(`     ${C.gray}· Pattern: ${C.white}${h.content.substring(0, 70)}...${C.reset}`);
            patternContext += h.content + '\n';
        });
    } else {
        console.log(`  ${sym.miss} Task ini belum memiliki pola sukses di memori.`);
    }

    // ─── STEP 3: LanceDB failed_attempts ─────────────────────────────────────
    step(3, 7, 'LanceDB failed_attempts  →  Anti-pattern guard');
    const failHits = semanticSearch(db.failed_attempts, queryVec, 2);

    let failContext = '';
    if (failHits.length > 0) {
        console.log(`  ${sym.warn} ${failHits.length} pola GAGAL terdeteksi`);
        failHits.forEach(h => {
            failContext += h.content + '\n';
        });
    }

    // ─── STEP 4: Context7 ────────────────────────────
    step(4, 7, 'Context7  →  ' + (report.vault_hit ? 'SKIP (vault hit ✅)' : 'Fetch docs'));
    let c7Context = '';
    if (!report.vault_hit) {
        const c7 = mockContext7Lookup(task);
        c7Context = c7.snippet;
        db.vault_knowledge.push({
            vector: queryVec,
            content: c7.snippet,
            metadata: JSON.stringify({ source: 'context7', task, ts: Date.now() })
        });
        writeCache(db);
        console.log(`  ${sym.ok} Disimpan ke LanceDB vault`);
    }

    // ─── STEP 5: Build Enriched Prompt ───────────────────────────────────────
    step(5, 7, 'Build Enriched Prompt  →  Inject semua konteks');

    const sections = [];
    sections.push(`## 🛠️ V7LA SYSTEM PERSISTENCE (Manifest v${PROTOCOL.version})\n- Active Strategies: Aider Architect, Devin Repair, Windsurf Graph Audit`);
    if (schemaContext) sections.push(`## 🏗️ Architect Workspace (Prisma Schema)\n${schemaContext.trim()}`);
    if (workspaceStructure) sections.push(`## 📂 Workspace Structure (Architect Mode+)\n${workspaceStructure.trim()}`);
    if (designBridgeContext) sections.push(`## 🔗 Deep Context (Windsurf Strategy)\n${designBridgeContext.trim()}`);

    // Aider Strategy
    sections.push(`## 🏗️ MULTI-FILE ARCHITECT MODE (Aider Strategy)
- Logic: You are now in BULK-EDITING mode. 
- Goal: Coordinate changes across multiple related files.
- Constraint: Ensure consistency across all files.`);

    // --- STRATEGIC ADVISOR MODE (Modified per User Request) ---
    if (task.includes('[STRATEGY ONLY]')) {
        sections.push(`## ⚠️ STRATEGIC ADVISOR MODE: SOLUSI EFEKTIF & EFISIEN
- **STATUS**: Informasi ini adalah hasil analisis mendalam (Analytical-Only).
- **FORBIDDEN**: Dilarang memanggil tool eksekusi tanpa izin Bapak.
- **BADGE**: Solusi ini sudah dirancang sangat EFEKTIF & EFISIEN.
- **READY**: Strategi ini sudah SIAP UNTUK DIEKSEKUSI jika Bapak setuju.
- **WAITING**: Saya MENUNGGU FEEDBACK dari Bapak sebelum melakukan langkah apa pun.
- **SEALING**: Jika Bapak puas, gunakan shortcut **\`k s\`** untuk menyegelnya ke Vault.
- **EXPLORE**: Setelah penyegelan, Bapak bisa mengetik **\`k [topik]\`** untuk melihat seluruh ilmu terkait.
- **PERINTAH**: AI harus mengakhiri respon dengan kalimat: "✅ Solusi ini sudah sangat efektif & efisien dan siap untuk dieksekusi. Ketik \`k s\` untuk menyegel solusi ini ke memori permanen (Vault) Bapak. Saya menunggu feedback selanjutnya."`);

        console.log(`  ${sym.bolt} ${C.bold}${C.green}EFFICIENCY ADVISOR ACTIVE${C.reset} — Advisory Badge injected.`);
    }

    if (vaultContext) sections.push(`## 📚 Vault Knowledge\n${vaultContext.trim()}`);
    if (patternContext) sections.push(`## ✅ Proven Patterns\n${patternContext.trim()}`);
    if (failContext) sections.push(`## ❌ Anti-Patterns\n${failContext.trim()}`);
    if (c7Context) sections.push(`## 🌐 Context7 Docs\n${c7Context.trim()}`);
    sections.push(`## 🎯 Task\n${task}`);

    const enrichedPrompt = sections.join('\n\n---\n\n');
    const outputFile = path.join(PROJECT_ROOT, 'nexus_prompt_output.md');
    fs.writeFileSync(outputFile, `# V7LA Nexus Pipeline Output\n**Task:** ${task}\n\n---\n\n${enrichedPrompt}`);

    // Update Draft Layer
    const draftEntry = { id: `DRAFT-${Date.now()}`, task, timestamp: report.timestamp, prompt: enrichedPrompt, status: 'PENDING', vector: queryVec };
    db.draft_sessions.push(draftEntry);
    writeCache(db);

    console.log(`  ${sym.ok} Enriched Prompt & Draft generated.`);

    // ─── STEP 7: Write-back (update proven_patterns jika baru) ───────────────
    // SECURITY GUARD: Skip auto-write if in Strategy Mode
    if (!task.includes('[STRATEGY ONLY]')) {
        step(7, 7, 'LanceDB write-back  →  Update memori pipeline');
        const exists = db.proven_patterns.some(p => cosineSimilarity(p.vector, queryVec) > 0.95);
        if (!exists) {
            db.proven_patterns.push({ vector: queryVec, content: `Task: ${task}`, metadata: JSON.stringify({ ts: Date.now() }) });
            writeCache(db);
            console.log(`  ${sym.ok} Task baru disimpan ke proven_patterns`);
        } else {
            console.log(`  ${sym.gray}  → Entry sudah ada, skip write${C.reset}`);
        }
    } else {
        step(7, 7, 'LanceDB write-back  →  SKIPPED (Strategy Mode ✅)');
        console.log(`  ${sym.ok} State tetap bersih — Menunggu perintah \`k s\` Master.`);
    }

    console.log(`\n${C.bold}${C.cyan}  ╔══════ NEXUS PIPELINE COMPLETE ══════╗${C.reset}`);
    console.log(`  ${sym.ok} Output file   : ${C.cyan}nexus_prompt_output.md${C.reset}`);
    console.log(`  ${sym.target} Kirim isi file tersebut ke Antigravity untuk eksekusi.`);
    console.log(`${C.bold}${C.cyan}  ╚═══════════════════════════════════════╝${C.reset}\n`);
}

const task = process.argv.slice(2).join(' ');
runNexusPipeline(task).catch(err => {
    console.error(`\n${C.red}PIPELINE ERROR: ${err.message}${C.reset}\n`);
    process.exit(1);
});
