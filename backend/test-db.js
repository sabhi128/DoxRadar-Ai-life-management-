const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to database...');
    try {
        await prisma.$connect();
        console.log('Successfully connected to database!');
        const result = await prisma.$queryRaw`SELECT 1+1 AS result`;
        console.log('Query executed:', result);
        await prisma.$disconnect();
        process.exit(0);
    } catch (e) {
        console.error('Connection failed:', e);
        process.exit(1);
    }
}

main();
