const asyncHandler = require('express-async-handler');
const prisma = require('../prismaClient');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    const totalDocs = await prisma.document.count({
        where: { userId: req.user.id }
    });

    // Fetch all subscriptions to calc cost
    const subscriptions = await prisma.subscription.findMany({
        where: { userId: req.user.id }
    });

    const totalMonthlyCost = subscriptions.reduce((acc, sub) => {
        const price = parseFloat(sub.price) || 0;
        return sub.period === 'Monthly' ? acc + price : acc + (price / 12);
    }, 0);

    // Find nearest billing date
    const today = new Date();
    const upcomingBills = subscriptions
        .map(sub => ({
            ...sub,
            nextDate: new Date(sub.nextPayment)
        }))
        .filter(sub => sub.nextDate >= today)
        .sort((a, b) => a.nextDate - b.nextDate);

    const nextBill = upcomingBills.length > 0 ? upcomingBills[0] : null;

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

    // Fetch latest Life Audit
    const latestAudit = await prisma.lifeAudit.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
        totalDocuments: totalDocs,
        totalMonthlyCost: totalMonthlyCost.toFixed(2),
        nextBill: nextBill ? { name: nextBill.name, amount: nextBill.price, date: nextBill.nextPayment } : null,
        lifeAudit: latestAudit ? latestAudit.ratings : null, // Mapped 'scores' to 'ratings' based on schema
        subscriptionCount: subscriptions.length,
        spendChartData
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

module.exports = {
    getDashboardStats,
    getRecentActivity,
};
