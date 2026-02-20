const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addIndex() {
    try {
        console.log("Applying composite index to Document table...");
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Document_userId_createdAt_idx" ON "Document" ("userId", "createdAt" DESC)`;
        console.log("Index applied successfully!");
    } catch (err) {
        console.error("Failed to apply index:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

addIndex();
