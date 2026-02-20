const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function benchmark() {
    const start = Date.now();
    try {
        console.log("Starting benchmark for getDocuments query...");

        // Get a user with documents
        const docWithUser = await prisma.document.findFirst();
        if (!docWithUser) {
            console.log("No documents found in DB to benchmark.");
            return;
        }

        const userId = docWithUser.userId;
        console.log(`Benchmarking for user ID: ${userId}`);

        // Final optimization query
        const documents = await prisma.document.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                category: true,
                type: true,
                size: true,
                path: true,
                createdAt: true,
                analysis: true
            }
        });

        const end = Date.now();
        console.log(`Query returned ${documents.length} documents.`);
        console.log(`Query time: ${end - start}ms`);

        if (documents.length > 0) {
            const firstDoc = documents[0];
            const size = JSON.stringify(documents).length;
            console.log(`Total payload size: ${(size / 1024).toFixed(2)} KB`);
            console.log("Sample analysis structure:", Object.keys(firstDoc.analysis || {}));
        }

    } catch (err) {
        console.error("Benchmark failed:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

benchmark();
