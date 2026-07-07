#!/usr/bin/env node
/**
 * v7la_explorer.js — V7LA Knowledge Explorer
 * Provides a detailed view into the contents of LanceDB (vault, patterns, attempts).
 * Usage: node v7la_explorer.js [query]
 */

const fs = require('fs');
const path = require('path');

// ── Konfigurasi Portabilitas ──────────────────────────────────────────────────
const CORE_ROOT = process.env.V7LA_CORE_ROOT || path.resolve(__dirname, '..');
const LANCE_CACHE_VAULT = path.join(CORE_ROOT, 'vault', 'lancedb_v7la_cache.json');
const LANCE_CACHE_ROOT = path.join(CORE_ROOT, 'lancedb_v7la_cache.json');
const LANCE_CACHE = fs.existsSync(LANCE_CACHE_VAULT) ? LANCE_CACHE_VAULT : LANCE_CACHE_ROOT;

// ANSI Colors
const C = {
    reset: '\x1b[0m', bold: '\x1b[1m', cyan: '\x1b[36m',
    magenta: '\x1b[35m', yellow: '\x1b[33m', green: '\x1b[32m',
    red: '\x1b[31m', white: '\x1b[37m', gray: '\x1b[90m',
};

const query = process.argv.slice(2).join(' ').toLowerCase();

function box(title, color = C.cyan) {
    console.log(`\n${C.bold}${color}┌${'─'.repeat(60)}┐${C.reset}`);
    console.log(`${C.bold}${color}│ ${title.padEnd(59)}│${C.reset}`);
    console.log(`${C.bold}${color}└${'─'.repeat(60)}┘${C.reset}`);
}

function runExplorer() {
    if (!fs.existsSync(LANCE_CACHE)) {
        console.log(`${C.red}Vault not found at: ${LANCE_CACHE}${C.reset}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(LANCE_CACHE, 'utf8'));

    console.log(`\n${C.bold}${C.white}🔎 V7LA KNOWLEDGE EXPLORER${C.reset}`);
    if (query) console.log(`${C.gray}Searching for: "${query}"${C.reset}`);
    console.log(`${C.gray}────────────────────────────────────────────────────────────${C.reset}`);

    const isAll = query === 'all';
    const limit = isAll ? 999 : 10;
    const patLimit = isAll ? 999 : 5;

    // 1. Vault Knowledge (The "What")
    const vault = data.vault_knowledge || [];
    const filteredVault = (query && !isAll) ? vault.filter(item =>
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.content && item.content.toLowerCase().includes(query))
    ) : vault;

    box(`📚 VAULT KNOWLEDGE (${filteredVault.length} items)`, C.cyan);
    if (filteredVault.length === 0) console.log(`  ${C.gray}No items found.${C.reset}`);
    filteredVault.slice(0, limit).forEach((item, i) => {
        console.log(`  ${C.bold}${i + 1}. ${item.title || 'Untitled Knowledge'}${C.reset}`);
        if (item.source) console.log(`     ${C.gray}Source: ${item.source}${C.reset}`);
        const snippet = (item.content && !isAll) ? item.content.substring(0, 100).replace(/\n/g, ' ') + '...' : (item.content || 'No content.');
        console.log(`     ${C.white}${snippet}${C.reset}`);
        console.log('');
    });

    // 2. Proven Patterns (The "How")
    const patterns = data.proven_patterns || [];
    const filteredPatterns = (query && !isAll) ? patterns.filter(p =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.content && p.content.toLowerCase().includes(query))
    ) : patterns;

    box(`✅ PROVEN PATTERNS (${filteredPatterns.length} items)`, C.green);
    if (filteredPatterns.length === 0) console.log(`  ${C.gray}No items found.${C.reset}`);
    filteredPatterns.slice(0, patLimit).forEach((p, i) => {
        console.log(`  ${C.bold}${i + 1}. ${p.name || 'Anonymous Pattern'}${C.reset}`);
        const desc = (p.description || p.content || 'No description.').substring(0, isAll ? 500 : 100);
        console.log(`     ${C.white}${desc}${C.reset}`);
        if (p.files) console.log(`     ${C.gray}Affected Files: ${p.files.join(', ')}${C.reset}`);
        console.log('');
    });

    // 3. Failed Attempts (The "What NOT to do")
    const fails = data.failed_attempts || [];
    const filteredFails = (query && !isAll) ? fails.filter(f =>
        (f.error && f.error.toLowerCase().includes(query)) ||
        (f.context && f.context.toLowerCase().includes(query))
    ) : fails;

    box(`❌ ANTI-PATTERNS / FAILED ATTEMPTS (${filteredFails.length} items)`, C.red);
    if (filteredFails.length === 0) console.log(`  ${C.gray}No items found.${C.reset}`);
    filteredFails.slice(0, patLimit).forEach((f, i) => {
        console.log(`  ${C.bold}${i + 1}. Error: ${f.error || 'Unknown Error'}${C.reset}`);
        console.log(`     ${C.white}Context: ${f.context || 'No context.'}${C.reset}`);
        console.log('');
    });

    console.log(`${C.gray}────────────────────────────────────────────────────────────${C.reset}`);
    if (isAll) {
        console.log(`  ${C.yellow}Full Knowledge Audit Complete.${C.reset}`);
    } else {
        console.log(`  ${C.gray}Showing top results. Use "k all" for full list.${C.reset}`);
    }
    console.log(`  ${C.cyan}Total Inventory: ${vault.length + patterns.length + fails.length} Knowledge Points${C.reset}\n`);
}

runExplorer();
