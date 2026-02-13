const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        const count = await prisma.user.count();
        console.log(`Connection Successful. Total Users in Supabase: ${count}`);
    } catch (error) {
        console.error("Connection Failed:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
