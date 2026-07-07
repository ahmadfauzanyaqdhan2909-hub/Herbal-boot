#!/usr/bin/env node
/**
 * v7la_synergy.js — V7LA 5-Layer Integration Checker
 * Dipanggil oleh: .\openclaw.ps1 dev-mode activate
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LMS_ROOT = path.join(ROOT, 'lms-platform');
const WEBAPP = path.join(LMS_ROOT, 'apps', 'web');
const SCHEMA = path.join(LMS_ROOT, 'packages', 'db', 'prisma', 'schema.prisma');
const HOOKS = path.join(WEBAPP, 'hooks');
const API = path.join(WEBAPP, 'app', 'api');
const MIDDLE = path.join(WEBAPP, 'middleware.ts');

const OK = '\x1b[32m✅\x1b[0m';
const WARN = '\x1b[33m⚠️ \x1b[0m';
const ERR = '\x1b[31m❌\x1b[0m';
const DIM = '\x1b[90m';
const RST = '\x1b[0m';

const checks = [];

function check(label, condition, hint = '') {
    checks.push({ label, ok: condition, hint });
}

// ── Layer 1: SCHEMA ──────────────────────────────────────────────────────────
const schema = fs.existsSync(SCHEMA) ? fs.readFileSync(SCHEMA, 'utf8') : '';
check('[Schema] schema.prisma ditemukan', fs.existsSync(SCHEMA));
check('[Schema] Model Quiz punya field createdBy', schema.includes('createdBy'));
check('[Schema] Model QuizAttempt punya feedback', schema.includes('feedback'));
check('[Schema] Model User punya createdQuizzes', schema.includes('createdQuizzes'));

// ── Layer 2: HOOK ─────────────────────────────────────────────────────────────
const hookFiles = fs.existsSync(HOOKS) ? fs.readdirSync(HOOKS) : [];
check('[Hook] hooks/ directory exists', hookFiles.length > 0);
check('[Hook] useQuiz.ts tersedia', hookFiles.includes('useQuiz.ts'));
check('[Hook] useStudentDashboard.ts tersedia', hookFiles.includes('useStudentDashboard.ts'));
check('[Hook] useLecturerDashboard.ts tersedia', hookFiles.includes('useLecturerDashboard.ts'));

// ── Layer 3: SERVICE ──────────────────────────────────────────────────────────
const quizRoute = path.join(API, 'quizzes', 'route.ts');
const quizIdRoute = path.join(API, 'quizzes', '[id]', 'route.ts');
const submitRoute = path.join(API, 'quizzes', '[id]', 'submit', 'route.ts');
const genRoute = path.join(API, 'quizzes', 'generate', 'route.ts');

const quizContent = fs.existsSync(quizRoute) ? fs.readFileSync(quizRoute, 'utf8') : '';
const idContent = fs.existsSync(quizIdRoute) ? fs.readFileSync(quizIdRoute, 'utf8') : '';
const genContent = fs.existsSync(genRoute) ? fs.readFileSync(genRoute, 'utf8') : '';

check('[Service] POST /api/quizzes ada auth check (403)', quizContent.includes('403'));
check('[Service] POST /api/quizzes simpan createdBy', quizContent.includes('createdBy'));
check('[Service] DELETE /api/quizzes/[id] ada auth check', idContent.includes('403'));
check('[Service] Generate — smart distractors (shuffle)', genContent.includes('sort(() => Math.random'));

// ── Layer 4: UI ───────────────────────────────────────────────────────────────
const quizForm = path.join(WEBAPP, 'components', 'dashboard', 'lecturer', 'quiz', 'QuizForm.tsx');
const quizList = path.join(WEBAPP, 'components', 'dashboard', 'lecturer', 'quiz', 'QuizList.tsx');
const quizStats = path.join(WEBAPP, 'components', 'dashboard', 'lecturer', 'quiz', 'QuizStats.tsx');
const quizCard = path.join(WEBAPP, 'components', 'QuizCard.tsx');

check('[UI] QuizForm.tsx tersedia', fs.existsSync(quizForm));
check('[UI] QuizList.tsx tersedia', fs.existsSync(quizList));
check('[UI] QuizStats.tsx tersedia', fs.existsSync(quizStats));
check('[UI] QuizCard.tsx tersedia', fs.existsSync(quizCard));

// ── Layer 5: EDGE ─────────────────────────────────────────────────────────────
const mwContent = fs.existsSync(MIDDLE) ? fs.readFileSync(MIDDLE, 'utf8') : '';
check('[Edge] middleware.ts tersedia', fs.existsSync(MIDDLE));
check('[Edge] Auth guard (cookie check)', mwContent.includes('lms_user_id'));
check('[Edge] Role guard (lms_user_role)', mwContent.includes('lms_user_role'));
check('[Edge] STUDENT redirect ke /student', mwContent.includes("pathname = '/student'"));
check('[Edge] LECTURER redirect ke /lecturer', mwContent.includes("pathname = '/lecturer'"));

// ── REPORT ────────────────────────────────────────────────────────────────────
console.log('\n\x1b[1m\x1b[36m╔══════════════════════════════════════════╗\x1b[0m');
console.log('\x1b[1m\x1b[36m║   V7LA SYNERGY CHECK — 5-Layer Audit    ║\x1b[0m');
console.log('\x1b[1m\x1b[36m╚══════════════════════════════════════════╝\x1b[0m\n');

let passed = 0; let failed = 0;
for (const c of checks) {
    const icon = c.ok ? OK : ERR;
    console.log(`  ${icon} ${c.label}${c.hint ? `\n    ${DIM}→ ${c.hint}${RST}` : ''}`);
    c.ok ? passed++ : failed++;
}

const pct = Math.round((passed / checks.length) * 100);
const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
console.log(`\n  \x1b[36m[${bar}] ${pct}%\x1b[0m  ${passed}/${checks.length} checks passed`);

if (failed === 0) {
    console.log('\n\x1b[32m  🎯 Synergy: FULL — Semua layer terintegrasi!\x1b[0m\n');
    process.exit(0);
} else {
    console.log(`\n\x1b[33m  ⚠  Synergy: PARTIAL — ${failed} issue perlu diperbaiki\x1b[0m\n`);
    process.exit(1);
}
