const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumn() {
    try {
        console.log("Attempting to add 'plan' column via raw SQL...");
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'Free';
        `);
        console.log("Column 'plan' added successfully (or already existed).");
    } catch (err) {
        console.error("Failed to add column:");
        console.error(err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

addColumn();
