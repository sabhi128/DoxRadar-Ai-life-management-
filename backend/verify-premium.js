const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    try {
        console.log("Checking user plan in DB...");
        // Get the test user - using the one from previous tests
        const user = await prisma.user.findFirst({
            where: { email: 'test@example.com' } // Assuming this is the test user
        });

        if (!user) {
            console.log("Test user not found, checking any user...");
            const anyUser = await prisma.user.findFirst();
            console.log("Found user:", anyUser.email, "Plan:", anyUser.plan);
            return;
        }

        console.log("Current Plan:", user.plan);

        // Simulate upgrade
        console.log("Upgrading to Pro...");
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'Pro' }
        });
        console.log("New Plan:", updated.plan);

        // Revert for testing manual flow
        await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'Free' }
        });
        console.log("Reverted to Free for manual test.");

    } catch (err) {
        console.error("Verification failed:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
