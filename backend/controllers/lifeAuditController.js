const asyncHandler = require('express-async-handler');
const prisma = require('../prismaClient');

const HIGH_COST_THRESHOLD = 50;

// @desc    Get life audits
// @route   GET /api/life-audit
// @access  Private
const getLifeAudits = asyncHandler(async (req, res) => {
    const audits = await prisma.lifeAudit.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(audits);
});

// @desc    Create new life audit
// @route   POST /api/life-audit
// @access  Private
const createLifeAudit = asyncHandler(async (req, res) => {
    const { scores, notes } = req.body;

    if (!scores) {
        res.status(400);
        throw new Error('Please add scores');
    }

    const audit = await prisma.lifeAudit.create({
        data: {
            userId: req.user.id,
            ratings: scores,
            notes,
        },
    });

    res.status(201).json(audit);
});

// @desc    Generate monthly life audit report
// @route   GET /api/life-audit/report
// @access  Private
const getMonthlyReport = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const now = new Date();

    // --- 1. Subscriptions data ---
    const subscriptions = await prisma.subscription.findMany({
        where: { userId }
    });

    const totalMonthlyCost = subscriptions.reduce((acc, sub) => {
        const price = parseFloat(sub.price) || 0;
        return sub.period === 'Monthly' ? acc + price : acc + (price / 12);
    }, 0);

    // Flagged: high-cost subscriptions (monthly > $50)
    const flaggedSubscriptions = subscriptions
        .filter(sub => {
            const monthly = sub.period === 'Monthly' ? sub.price : sub.price / 12;
            return monthly >= HIGH_COST_THRESHOLD;
        })
        .map(sub => ({
            id: sub.id,
            name: sub.name,
            price: sub.price,
            period: sub.period,
            monthlyCost: sub.period === 'Monthly' ? sub.price : parseFloat((sub.price / 12).toFixed(2)),
            category: sub.category,
        }));

    // Potential savings = sum of flagged monthly costs (what user could save by cancelling)
    const potentialSavings = flaggedSubscriptions.reduce((acc, sub) => acc + sub.monthlyCost, 0);

    // Upcoming payments (next 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingPayments = subscriptions
        .filter(sub => {
            const nextDate = new Date(sub.nextPayment);
            return nextDate >= now && nextDate <= thirtyDaysFromNow;
        })
        .map(sub => {
            const nextDate = new Date(sub.nextPayment);
            return {
                id: sub.id,
                name: sub.name,
                price: sub.price,
                nextPayment: sub.nextPayment,
                daysLeft: Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24)),
            };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft);

    // --- 2. Documents data ---
    const allDocs = await prisma.document.findMany({
        where: { userId },
        select: { id: true, name: true, category: true, analysis: true, createdAt: true }
    });

    // Risks: collect all risks from AI analyses
    const risksDetected = [];
    const expiringDocuments = [];
    const expiredDocuments = [];

    for (const doc of allDocs) {
        // Collect risks
        if (doc.analysis?.risks && Array.isArray(doc.analysis.risks)) {
            doc.analysis.risks.forEach(risk => {
                risksDetected.push({
                    documentName: doc.name,
                    documentId: doc.id,
                    risk,
                });
            });
        }

        // Check expiry
        const expiryStr = doc.analysis?.expiryDate;
        if (expiryStr) {
            const expiryDate = new Date(expiryStr);
            if (!isNaN(expiryDate.getTime())) {
                if (expiryDate < now) {
                    expiredDocuments.push({
                        id: doc.id,
                        name: doc.name,
                        category: doc.category,
                        expiryDate: expiryStr,
                        status: 'expired',
                    });
                } else if (expiryDate <= thirtyDaysFromNow) {
                    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                    expiringDocuments.push({
                        id: doc.id,
                        name: doc.name,
                        category: doc.category,
                        expiryDate: expiryStr,
                        daysLeft,
                        status: 'expiring',
                    });
                }
            }
        }
    }

    expiringDocuments.sort((a, b) => a.daysLeft - b.daysLeft);

    // --- 3. Latest self-assessment scores ---
    const latestAudit = await prisma.lifeAudit.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });

    // --- 4. Compute overall health score ---
    let overallScore = 0;
    let scoreBreakdown = {};
    if (latestAudit?.ratings) {
        const ratings = latestAudit.ratings;
        const keys = Object.keys(ratings);
        const sum = keys.reduce((acc, k) => acc + (parseInt(ratings[k]) || 0), 0);
        overallScore = keys.length > 0 ? parseFloat((sum / keys.length).toFixed(1)) : 0;
        scoreBreakdown = ratings;
    }

    // --- 5. Build the report ---
    const report = {
        generatedAt: now.toISOString(),
        month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),

        // Money
        moneySummary: {
            totalMonthlyCost: parseFloat(totalMonthlyCost.toFixed(2)),
            potentialSavings: parseFloat(potentialSavings.toFixed(2)),
            subscriptionCount: subscriptions.length,
            upcomingPaymentsCount: upcomingPayments.length,
            upcomingPayments: upcomingPayments.slice(0, 5),
        },

        // Risks
        risksSummary: {
            totalRisks: risksDetected.length,
            risks: risksDetected.slice(0, 10),
        },

        // Deadlines
        deadlinesSummary: {
            expiringDocumentsCount: expiringDocuments.length,
            expiredDocumentsCount: expiredDocuments.length,
            upcomingPaymentsCount: upcomingPayments.length,
            expiringDocuments: expiringDocuments.slice(0, 5),
            expiredDocuments: expiredDocuments.slice(0, 5),
            upcomingPayments: upcomingPayments.slice(0, 5),
            totalDeadlines: expiringDocuments.length + expiredDocuments.length + upcomingPayments.length,
        },

        // Subscriptions flagged
        subscriptionsFlagged: {
            highCostCount: flaggedSubscriptions.length,
            flaggedSubscriptions: flaggedSubscriptions.slice(0, 5),
            potentialMonthlySavings: parseFloat(potentialSavings.toFixed(2)),
        },

        // Documents needing attention
        documentsAttention: {
            expiredCount: expiredDocuments.length,
            expiringCount: expiringDocuments.length,
            totalNeedingAttention: expiredDocuments.length + expiringDocuments.length,
            documents: [...expiredDocuments, ...expiringDocuments].slice(0, 8),
        },

        // Self-assessment
        selfAssessment: {
            overallScore,
            scoreBreakdown,
            lastAuditDate: latestAudit?.createdAt || null,
        },
    };

    res.status(200).json(report);
});

module.exports = {
    getLifeAudits,
    createLifeAudit,
    getMonthlyReport,
};
