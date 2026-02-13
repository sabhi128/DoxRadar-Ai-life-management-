const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDashboard() {
    try {
        console.log("--- Starting Dashboard Test ---");

        // 1. Get first user
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No users found. Cannot test.");
            return;
        }
        console.log(`Testing with User ID: ${user.id}`);

        // 2. Get initial count
        const initialCount = await prisma.document.count({
            where: { userId: user.id }
        });
        console.log(`Initial Doc Count: ${initialCount}`);

        // 3. Create a dummy document
        const newDoc = await prisma.document.create({
            data: {
                userId: user.id,
                name: "Test Doc " + Date.now(),
                type: "PDF",
                size: "1MB",
                path: "https://example.com/test.pdf",
                category: "Test"
            }
        });
        console.log(`Created Doc: ${newDoc.id}`);

        // 4. Get new count
        const newCount = await prisma.document.count({
            where: { userId: user.id }
        });
        console.log(`New Doc Count: ${newCount}`);

        if (newCount === initialCount + 1) {
            console.log("SUCCESS: Dashboard logic sees the new document.");
        } else {
            console.error("FAILURE: Dashboard logic did NOT update.");
        }

        // Cleanup
        await prisma.document.delete({ where: { id: newDoc.id } });
        console.log("Cleaned up test document.");

    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testDashboard();
