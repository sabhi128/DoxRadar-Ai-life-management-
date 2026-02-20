const asyncHandler = require('express-async-handler');
const prisma = require('../prismaClient');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    // Run independent queries in parallel for performance
    const [totalDocs, subscriptions, latestAudit, allDocsLight] = await Promise.all([
        prisma.document.count({ where: { userId: req.user.id } }),
        prisma.subscription.findMany({ where: { userId: req.user.id } }),
        prisma.lifeAudit.findFirst({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        }),
        // Fetch only necessary fields for expiration check
        prisma.document.findMany({
            where: { userId: req.user.id },
            select: { id: true, name: true, category: true, analysis: true }
        })
    ]);

    const totalMonthlyCost = subscriptions.reduce((acc, sub) => {
        const price = parseFloat(sub.price) || 0;
        return sub.period === 'Monthly' ? acc + price : acc + (price / 12);
    }, 0);

    // Find nearest billing date + upcoming payments within 7 days
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingBills = subscriptions
        .map(sub => ({
            ...sub,
            nextDate: new Date(sub.nextPayment)
        }))
        .filter(sub => sub.nextDate >= today)
        .sort((a, b) => a.nextDate - b.nextDate);

    const nextBill = upcomingBills.length > 0 ? upcomingBills[0] : null;

    // Upcoming payments within 7 days (for dashboard widget)
    const upcomingPayments = upcomingBills
        .filter(sub => sub.nextDate <= sevenDaysFromNow)
        .map(sub => ({
            id: sub.id,
            name: sub.name,
            price: sub.price,
            category: sub.category,
            nextPayment: sub.nextPayment,
            daysLeft: Math.ceil((sub.nextDate - today) / (1000 * 60 * 60 * 24))
        }));

    // High-cost subscriptions (monthly equivalent > $50)
    const HIGH_COST_THRESHOLD = 50;
    const highCostSubscriptions = subscriptions
        .filter(sub => {
            const monthly = sub.period === 'Monthly' ? sub.price : sub.price / 12;
            return monthly >= HIGH_COST_THRESHOLD;
        })
        .map(sub => ({
            id: sub.id,
            name: sub.name,
            price: sub.price,
            period: sub.period,
            monthlyCost: sub.period === 'Monthly' ? sub.price : parseFloat((sub.price / 12).toFixed(2))
        }));

    // Calc spend by category
    const spendByCategory = subscriptions.reduce((acc, sub) => {
        const cost = sub.period === 'Monthly' ? (parseFloat(sub.price) || 0) : (parseFloat(sub.price) || 0) / 12;
        acc[sub.category] = (acc[sub.category] || 0) + cost;
        return acc;
    }, {});

    const spendChartData = Object.keys(spendByCategory).map(key => ({
        name: key,
        amount: parseFloat(spendByCategory[key].toFixed(2))
    })).sort((a, b) => b.amount - a.amount).slice(0, 5); // Top 5 categories

    // --- Document Expiration Tracking ---
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringDocuments = [];
    const expiredDocuments = [];

    for (const doc of allDocsLight) {
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
                        status: 'expired'
                    });
                } else if (expiryDate <= thirtyDaysFromNow) {
                    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                    expiringDocuments.push({
                        id: doc.id,
                        name: doc.name,
                        category: doc.category,
                        expiryDate: expiryStr,
                        daysLeft,
                        status: 'expiring'
                    });
                }
            }
        }
    }

    // Sort expiring by most urgent first
    expiringDocuments.sort((a, b) => a.daysLeft - b.daysLeft);

    res.status(200).json({
        totalDocuments: totalDocs,
        totalMonthlyCost: totalMonthlyCost.toFixed(2),
        nextBill: nextBill ? { name: nextBill.name, amount: nextBill.price, date: nextBill.nextPayment } : null,
        lifeAudit: latestAudit ? latestAudit.ratings : null,
        subscriptionCount: subscriptions.length,
        spendChartData,
        expiringDocuments,
        expiredDocuments,
        upcomingPayments,
        highCostSubscriptions
    });
});

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
// @access  Private
const getRecentActivity = asyncHandler(async (req, res) => {
    // Fetch recent 5 documents
    const recentDocs = await prisma.document.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    // Map to the format frontend expects
    const activityLog = recentDocs.map(doc => ({
        id: doc.id,
        name: doc.name,
        role: doc.category,
        timeIn: new Date(doc.createdAt).toLocaleDateString(),
        timeOut: 'N/A',
        status: doc.analysis ? 'AI Analyzed' : 'Uploaded',
        statusColor: doc.analysis ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
    }));

    res.status(200).json(activityLog);
});

// @desc    Get complete dashboard summary (stats + activity)
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = asyncHandler(async (req, res) => {
    // Run all queries in parallel
    const [totalDocs, subscriptions, latestAudit, allDocsLight, recentDocs] = await Promise.all([
        prisma.document.count({ where: { userId: req.user.id } }),
        prisma.subscription.findMany({ where: { userId: req.user.id } }),
        prisma.lifeAudit.findFirst({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.document.findMany({
            where: { userId: req.user.id },
            select: { id: true, name: true, category: true, analysis: true }
        }),
        prisma.document.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 5
        })
    ]);

    // 1. Process Stats
    const totalMonthlyCost = subscriptions.reduce((acc, sub) => {
        const price = parseFloat(sub.price) || 0;
        return sub.period === 'Monthly' ? acc + price : acc + (price / 12);
    }, 0);

    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingBills = subscriptions
        .map(sub => ({ ...sub, nextDate: new Date(sub.nextPayment) }))
        .filter(sub => sub.nextDate >= today)
        .sort((a, b) => a.nextDate - b.nextDate);

    const nextBill = upcomingBills.length > 0 ? upcomingBills[0] : null;

    const upcomingPayments = upcomingBills
        .filter(sub => sub.nextDate <= sevenDaysFromNow)
        .map(sub => ({
            id: sub.id,
            name: sub.name,
            price: sub.price,
            category: sub.category,
            nextPayment: sub.nextPayment,
            daysLeft: Math.ceil((sub.nextDate - today) / (1000 * 60 * 60 * 24))
        }));

    const spendByCategory = subscriptions.reduce((acc, sub) => {
        const cost = sub.period === 'Monthly' ? (parseFloat(sub.price) || 0) : (parseFloat(sub.price) || 0) / 12;
        acc[sub.category] = (acc[sub.category] || 0) + cost;
        return acc;
    }, {});

    const spendChartData = Object.keys(spendByCategory).map(key => ({
        name: key,
        amount: parseFloat(spendByCategory[key].toFixed(2))
    })).sort((a, b) => b.amount - a.amount).slice(0, 5);

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringDocuments = [];
    const expiredDocuments = [];

    for (const doc of allDocsLight) {
        if (!doc.analysis) continue;
        const expiryStr = doc.analysis.expiryDate;
        if (expiryStr) {
            const expiryDate = new Date(expiryStr);
            if (!isNaN(expiryDate.getTime())) {
                if (expiryDate < now) {
                    expiredDocuments.push({
                        id: doc.id,
                        name: doc.name,
                        category: doc.category,
                        expiryDate: expiryStr,
                        status: 'expired'
                    });
                } else if (expiryDate <= thirtyDaysFromNow) {
                    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                    expiringDocuments.push({
                        id: doc.id,
                        name: doc.name,
                        category: doc.category,
                        expiryDate: expiryStr,
                        daysLeft,
                        status: 'expiring'
                    });
                }
            }
        }
    }
    expiringDocuments.sort((a, b) => a.daysLeft - b.daysLeft);

    // 2. Process Activity
    const activityLog = recentDocs.map((doc, index) => ({
        id: doc.id,
        name: doc.name,
        role: doc.category,
        timeIn: new Date(doc.createdAt).toLocaleDateString(),
        timeOut: 'N/A',
        status: doc.analysis ? 'AI Analyzed' : 'Uploaded',
        statusColor: doc.analysis ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
    }));

    res.status(200).json({
        stats: {
            totalDocuments: totalDocs,
            totalMonthlyCost: totalMonthlyCost.toFixed(2),
            nextBill: nextBill ? { name: nextBill.name, amount: nextBill.price, date: nextBill.nextPayment } : null,
            lifeAudit: latestAudit ? latestAudit.ratings : null,
            subscriptionCount: subscriptions.length,
            spendChartData,
            expiringDocuments,
            expiredDocuments,
            upcomingPayments
        },
        activityLog
    });
});

module.exports = {
    getDashboardStats,
    getRecentActivity,
    getDashboardSummary
};
