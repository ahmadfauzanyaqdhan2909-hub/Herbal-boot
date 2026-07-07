const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Manually load .env to ensure Prisma knows where the absolute DB path is
const envPath = path.join(__dirname, '../lms-platform/apps/web/.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL=["']?(.+?)["']?(\s|$)/);
    if (dbUrlMatch) {
        process.env.DATABASE_URL = dbUrlMatch[1];
    }
}

const prisma = new PrismaClient();

async function main() {
    console.log('--- V7LA MASTER EXPORT: Capturing Layer 1-3 Data ---');
    console.log(`[DB] Using: ${process.env.DATABASE_URL || 'default'}`);

    // 1. Fetch Programs
    const programs = await prisma.studyProgram.findMany();
    console.log(`[INGEST] Found ${programs.length} Study Programs`);

    // 2. Fetch Courses
    const courses = await prisma.course.findMany();
    console.log(`[INGEST] Found ${courses.length} Courses`);

    // 3. Fetch Classes
    const classes = await prisma.class.findMany();
    console.log(`[INGEST] Found ${classes.length} Classes`);

    const masterData = {
        programs,
        courses,
        classes,
        timestamp: new Date().toISOString()
    };

    const targetPath = path.join(__dirname, '../lms-platform/packages/db/donny_master_data.json');
    fs.writeFileSync(targetPath, JSON.stringify(masterData, null, 2));

    console.log(`\n✅ Master data saved to: ${targetPath}`);
    console.log('Use .\\r to restore this data after a database reset.');
}

main()
    .catch(e => console.error('Export Error:', e))
    .finally(() => prisma.$disconnect());
