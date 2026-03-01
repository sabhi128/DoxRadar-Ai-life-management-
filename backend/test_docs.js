const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const tokens = await prisma.gmailToken.findMany({ select: { userId: true, email: true } });
    console.log(JSON.stringify(tokens, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
