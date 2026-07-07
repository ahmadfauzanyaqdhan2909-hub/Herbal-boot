#!/usr/bin/env node
/**
 * v7la_sync_graph.js — V7LA Graph Bridge
 * Syncs the MCP Memory graph structure into LanceDB cache.
 * Usage: node v7la_sync_graph.js [json_dump_path]
 */

const fs = require('fs');
const path = require('path');

const CORE_ROOT = process.env.V7LA_CORE_ROOT || path.resolve(__dirname, '..');
const CACHE_FILE = path.join(CORE_ROOT, 'vault', 'lancedb_v7la_cache.json');

const C = {
    reset: '\x1b[0m', bold: '\x1b[1m', cyan: '\x1b[36m',
    green: '\x1b[32m', yellow: '\x1b[33m', gray: '\x1b[90m'
};

const dumpPath = process.argv[2];

function readCache() {
    if (fs.existsSync(CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
    return { vault_knowledge: [], proven_patterns: [], failed_attempts: [], design_bridge: [] };
}

function writeCache(db) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(db, null, 2));
}

function runSync() {
    if (!dumpPath || !fs.existsSync(dumpPath)) {
        console.log(`${C.yellow}No graph dump provided. Use: node v7la_sync_graph.js [path]${C.reset}`);
        return;
    }

    try {
        const graph = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
        const db = readCache();

        // Extract key entities and relations
        const entities = (graph.entities || []).map(e => ({
            name: e.name,
            type: e.entityType,
            obs: e.observations?.slice(0, 3) // store top 3 observations
        }));

        const relations = (graph.relations || []).map(r => ({
            from: r.from,
            to: r.to,
            type: r.relationType
        }));

        db.design_bridge = {
            last_sync: new Date().toISOString(),
            entity_count: entities.length,
            relation_count: relations.length,
            entities,
            relations
        };

        writeCache(db);
        console.log(`\n${C.green}${C.bold}✅ GRAPH SYNC COMPLETE${C.reset}`);
        console.log(`${C.cyan}  Entities Synced  : ${entities.length}${C.reset}`);
        console.log(`${C.cyan}  Relations Synced : ${relations.length}${C.reset}`);
        console.log(`${C.gray}  Structural knowledge is now persistent in LanceDB.${C.reset}\n`);
    } catch (e) {
        console.log(`${C.yellow}Sync Error: ${e.message}${C.reset}`);
    }
}

runSync();
