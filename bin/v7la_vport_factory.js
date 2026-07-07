#!/usr/bin/env node
/**
 * v7la_vport_factory.js — V7LA V-PORT Factory (v1.7.0)
 * Sprouts new portable projects based on the V-PORT template.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MASTER_ROOT = process.env.V7LA_PROJECT_ROOT || path.resolve(__dirname, '..');
let TEMPLATE_DIR = path.join(MASTER_ROOT, 'v7la-vport-template');

// Smart Template Detection: If MASTER_ROOT IS the template, or contains it.
if (!fs.existsSync(TEMPLATE_DIR)) {
    if (MASTER_ROOT.toLowerCase().endsWith('v7la-vport-template')) {
        TEMPLATE_DIR = MASTER_ROOT;
    }
}

const C = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
    reset: '\x1b[0m'
};

function createVPort(projectName) {
    if (!projectName) {
        console.log(`\n${C.red}❌ Error: Please provide a project name.${C.reset}`);
        console.log(`Usage: v-port "MyNewProject"\n`);
        return;
    }

    let targetRoot = process.cwd();
    // Prevent circular copy: If inside template, go up one level for destination
    if (targetRoot.toLowerCase().endsWith('v7la-vport-template')) {
        targetRoot = path.resolve(targetRoot, '..');
    }
    const targetDir = path.resolve(targetRoot, projectName);

    console.log(`\n${C.bold}${C.cyan}🏗️  V7LA V-PORT FACTORY — v1.7.0${C.reset}`);
    console.log(`  > Destination: ${targetDir}`);

    if (fs.existsSync(targetDir)) {
        console.log(`  ${C.red}❌ Error: Directory already exists.${C.reset}`);
        return;
    }

    try {
        // 1. Copy Template
        console.log(`  > Sprouting new Seed from Template...`);
        fs.mkdirSync(targetDir, { recursive: true });

        // Use shell copy for efficiency
        const copyCmd = process.platform === 'win32'
            ? `xcopy /E /I /Y "${TEMPLATE_DIR}" "${targetDir}"`
            : `cp -R "${TEMPLATE_DIR}/." "${targetDir}"`;

        execSync(copyCmd, { stdio: 'ignore' });

        // 2. Auto-Seed Runtime (Copy node.exe from Master)
        console.log(`  > Auto-Seeding Runtime Engine...`);
        const sourceRuntime = path.join(MASTER_ROOT, 'runtime');
        const targetRuntime = path.join(targetDir, 'runtime');

        if (fs.existsSync(sourceRuntime)) {
            const runtimeCopyCmd = process.platform === 'win32'
                ? `xcopy /E /I /Y "${sourceRuntime}" "${targetRuntime}"`
                : `cp -R "${sourceRuntime}/." "${targetRuntime}"`;
            execSync(runtimeCopyCmd, { stdio: 'ignore' });
            console.log(`  ${C.green}✅ Runtime Engine Seeded Successfuly.${C.reset}`);
        } else {
            console.log(`  ${C.yellow}⚠️  Warning: Master runtime folder not found. Runtime must be filled manually.${C.reset}`);
        }

        console.log(`\n${C.green}✨ V-PORT PROJECT CREATED: ${projectName}${C.reset}`);
        console.log(`  1. CD ${projectName}`);
        console.log(`  2. Click 'Launch-V7LA.bat' to activate Kasta.`);
        console.log(`  3. Happy Coding, Pak Operator! 🛡️✨🚀👑💎\n`);

    } catch (err) {
        console.error(`${C.red}❌ Critical Error during creation: ${err.message}${C.reset}`);
    }
}

const projectName = process.argv[2];
createVPort(projectName);
