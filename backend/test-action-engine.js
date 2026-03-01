const { analyzeDocument } = require('./services/aiService');
const { createNotification } = require('./services/notificationService');
const prisma = require('./prismaClient');

const userId = '3f59bbbf-a6f6-4808-8300-3de6fb3d77ba'; // Hardcoded test user id used before

async function testActionEngine() {
    console.log("== Injecting Fake Overdue Bill to test Action Engine ==");

    // Simulate what the AI would output for a late fee
    const fakeAiOutput = {
        summary: "This is a final notice for an unpaid utility bill.",
        plainLanguageExplanation: "Your utility bill is past due and will incur a late fee tomorrow.",
        suggestedCategory: "Bill",
        expiryDate: "2026-03-02",
        renewalDate: null,
        isSubscription: false,
        isScam: false,
        severityLevel: "Critical",
        requiresAction: true,
        actionRecommendation: "URGENT: Pay $85.00 by tomorrow to avoid late fee and protect credit score."
    };

    // Simulate the Ingestion Engine logic
    console.log("AI returned:", fakeAiOutput);

    const severityColors = {
        'Low': 'info',
        'Medium': 'warning',
        'High': 'warning',
        'Critical': 'danger'
    };

    const notifType = severityColors[fakeAiOutput.severityLevel] || 'info';

    if (fakeAiOutput.requiresAction && fakeAiOutput.actionRecommendation && !fakeAiOutput.isScam) {
        console.log("Emitting Action Required Notification...");
        await createNotification(userId, {
            type: notifType,
            title: fakeAiOutput.severityLevel === 'Critical' ? '🛑 URGENT ACTION REQUIRED' : '⚡ Action Recommended',
            message: fakeAiOutput.actionRecommendation,
            metadata: { fakeId: 123, severity: fakeAiOutput.severityLevel }
        });
        console.log("Successfully emitted notification!");
    } else {
        console.log("No action required.");
    }
}

testActionEngine().catch(console.error).finally(() => prisma.$disconnect());
