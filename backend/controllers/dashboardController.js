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

    // Dynamic Storage Calculation
    const planLimits = { 'Free': 20, 'Pro': 200 };
    const userPlan = req.user.plan || 'Free';
    const storageLimit = planLimits[userPlan] || 20;
    const storagePercentage = Math.min(Math.round((totalDocs / storageLimit) * 100), 100);

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
        highCostSubscriptions,
        storagePercentage,
        storageLimit
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
    const today = new Date();
    // Run core queries in parallel
    const [subscriptions, latestAudit, allDocs, incomes] = await Promise.all([
        prisma.subscription.findMany({ where: { userId: req.user.id } }),
        prisma.lifeAudit.findFirst({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.document.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, category: true, analysis: true, createdAt: true }
        }),
        prisma.income.findMany({ where: { userId: req.user.id } })
    ]);

    // 1. Process Stats
    // Expenses
    const currentMonthlyCost = subscriptions.reduce((acc, sub) => {
        const price = parseFloat(sub.price) || 0;
        return sub.period === 'Monthly' ? acc + price : acc + (price / 12);
    }, 0);

    // Expense Trend Calculation (Comparing vs 30 days ago)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oldMonthlyCost = subscriptions.filter(sub => new Date(sub.createdAt) < thirtyDaysAgo).reduce((acc, sub) => {
        const price = parseFloat(sub.price) || 0;
        return sub.period === 'Monthly' ? acc + price : acc + (price / 12);
    }, 0);

    const expenseTrend = oldMonthlyCost > 0 ? ((currentMonthlyCost - oldMonthlyCost) / oldMonthlyCost) * 100 : 0;

    // Revenue
    const totalMonthlyRevenue = incomes.reduce((acc, inc) => {
        const amount = parseFloat(inc.amount) || 0;
        return inc.frequency === 'Monthly' ? acc + amount : acc + (amount / 12);
    }, 0);

    // Revenue Trend Calculation (Comparing current month vs last month)
    const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const lastMonthIncomes = incomes.filter(inc => {
        const date = new Date(inc.date);
        return date >= firstDayLastMonth && date < firstDayCurrentMonth;
    });

    const lastMonthRevenue = lastMonthIncomes.reduce((acc, inc) => {
        const amount = parseFloat(inc.amount) || 0;
        return inc.frequency === 'Monthly' ? acc + amount : acc + (amount / 12);
    }, 0);

    const revenueTrend = lastMonthRevenue > 0 ? ((totalMonthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    const netCashFlow = totalMonthlyRevenue - currentMonthlyCost;

    // Advanced Expense Analysis
    const HIGH_COST_THRESHOLD = 50;
    const flaggedSubscriptions = subscriptions.filter(sub => {
        const monthly = sub.period === 'Monthly' ? sub.price : sub.price / 12;
        return monthly >= HIGH_COST_THRESHOLD;
    });

    const potentialMonthlySavings = flaggedSubscriptions.reduce((acc, sub) => {
        const monthly = sub.period === 'Monthly' ? sub.price : sub.price / 12;
        return acc + monthly;
    }, 0);


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

    const sortedCategories = Object.keys(spendByCategory).map(key => ({
        name: key,
        amount: parseFloat(spendByCategory[key].toFixed(2))
    })).sort((a, b) => b.amount - a.amount);

    const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : { name: 'None', amount: 0 };
    const spendChartData = sortedCategories.slice(0, 5);

    // Financial Health Score (Simple algorithm)
    // Formula: (Revenue / (Expenses + 1)) * 10 - penalize for zero revenue or high expenses
    let financialHealthScore = 0;
    if (totalMonthlyRevenue > 0) {
        const ratio = currentMonthlyCost / totalMonthlyRevenue;
        if (ratio <= 0.3) financialHealthScore = 95;
        else if (ratio <= 0.5) financialHealthScore = 85;
        else if (ratio <= 0.7) financialHealthScore = 70;
        else if (ratio <= 0.9) financialHealthScore = 50;
        else financialHealthScore = 30;
    } else if (currentMonthlyCost > 0) {
        financialHealthScore = 15;
    } else {
        financialHealthScore = 50; // Neutral if no data
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringDocuments = [];
    const expiredDocuments = [];
    let risksCount = 0;

    // Process allDocs for expiries and risks
    for (const doc of allDocs) {
        if (!doc.analysis) continue;

        // Count risks
        if (doc.analysis.risks && Array.isArray(doc.analysis.risks)) {
            risksCount += doc.analysis.risks.length;
        }

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

    // Penalize health score for active risks or expired docs
    financialHealthScore = Math.max(0, financialHealthScore - (risksCount * 2) - (expiredDocuments.length * 5));

    // Dynamic Storage Calculation
    const planLimits = { 'Free': 20, 'Pro': 200 };
    const userPlan = req.user.plan || 'Free';
    const storageLimit = planLimits[userPlan] || 20;
    const storagePercentage = Math.min(Math.round((allDocs.length / storageLimit) * 100), 100);

    // 2. Process Activity (Top 5 from allDocs)
    const activityLog = allDocs.slice(0, 5).map((doc, index) => ({
        id: doc.id,
        name: doc.name,
        role: doc.category,
        timeIn: new Date(doc.createdAt).toLocaleDateString(),
        timeOut: 'N/A',
        status: doc.analysis ? 'AI Analyzed' : 'Uploaded',
        statusColor: doc.analysis ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
    }));

    const isPro = req.user.plan === 'Pro';

    res.status(200).json({
        user: {
            plan: req.user.plan || 'Free'
        },
        stats: {
            totalDocuments: allDocs.length,
            totalMonthlyCost: currentMonthlyCost.toFixed(2),
            totalMonthlyRevenue: totalMonthlyRevenue.toFixed(2),
            expenseTrend: expenseTrend.toFixed(1),
            revenueTrend: revenueTrend.toFixed(1),
            // Premium only fields
            netCashFlow: isPro ? netCashFlow.toFixed(2) : '0.00',
            financialHealthScore: isPro ? Math.round(financialHealthScore) : 0,
            topCategory: isPro ? topCategory : { name: 'Locked', amount: '0.00' },
            potentialMonthlySavings: isPro ? potentialMonthlySavings.toFixed(2) : '0.00',

            nextBill: nextBill ? { name: nextBill.name, amount: nextBill.price, date: nextBill.nextPayment } : null,
            lifeAudit: latestAudit ? latestAudit.ratings : null,
            subscriptionCount: subscriptions.length,
            incomeCount: incomes.length,
            spendChartData,
            expiringDocuments,
            expiredDocuments,
            upcomingPayments,
            storagePercentage,
            storageLimit,
            risksCount
        },
        activityLog
    });
});

module.exports = {
    getDashboardStats,
    getRecentActivity,
    getDashboardSummary
};
