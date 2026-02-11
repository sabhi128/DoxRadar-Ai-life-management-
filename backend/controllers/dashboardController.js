const asyncHandler = require('express-async-handler');
const Document = require('../models/Document');
const LifeAudit = require('../models/LifeAudit');
const Subscription = require('../models/Subscription');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    const totalDocs = await Document.countDocuments({ user: req.user.id });

    // Caclulate Documents by Category (for "Risk/Storage" widget)
    // We can use this to show "Personal" vs "Work" vs "Financial" docs
    const docsByCategory = await Document.aggregate([
        { $match: { user: req.user._id } }, // Ensure ObjectId match if using mongoose, req.user.id is string usually but let's trust middleware for now or cast if needed. 
        // Actually req.user.id is usually a string from simple middleware. Safe to use for simple find, but aggregate might need ObjectId.
        // Let's stick to simple counts to avoid ObjectId casting issues for now if we don't have mongoose.Types.ObjectId handy. 
        // We'll just fetch all and reduce, it's safer for small apps.
    ]);

    // Fetch all subscriptions to calc cost
    const subscriptions = await Subscription.find({ user: req.user.id });

    const totalMonthlyCost = subscriptions.reduce((acc, sub) => {
        const price = parseFloat(sub.price);
        return sub.billingCycle === 'Monthly' ? acc + price : acc + (price / 12);
    }, 0);

    // Find nearest billing date
    const today = new Date();
    const upcomingBills = subscriptions
        .map(sub => ({
            ...sub.toObject(),
            nextDate: new Date(sub.nextBillingDate)
        }))
        .filter(sub => sub.nextDate >= today)
        .sort((a, b) => a.nextDate - b.nextDate);

    const nextBill = upcomingBills.length > 0 ? upcomingBills[0] : null;

    // Calc spend by category
    const spendByCategory = subscriptions.reduce((acc, sub) => {
        const cost = sub.billingCycle === 'Monthly' ? sub.price : sub.price / 12;
        acc[sub.category] = (acc[sub.category] || 0) + cost;
        return acc;
    }, {});

    const spendChartData = Object.keys(spendByCategory).map(key => ({
        name: key,
        amount: parseFloat(spendByCategory[key].toFixed(2))
    })).sort((a, b) => b.amount - a.amount).slice(0, 5); // Top 5 categories

    // Fetch latest Life Audit
    const latestAudit = await LifeAudit.findOne({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
        totalDocuments: totalDocs,
        totalMonthlyCost: totalMonthlyCost.toFixed(2),
        nextBill: nextBill ? { name: nextBill.name, amount: nextBill.price, date: nextBill.nextBillingDate } : null,
        lifeAudit: latestAudit ? latestAudit.scores : null,
        subscriptionCount: subscriptions.length,
        spendChartData
    });
});

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
// @access  Private
const getRecentActivity = asyncHandler(async (req, res) => {
    // Fetch recent 5 documents
    const recentDocs = await Document.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5);

    // Map to the format frontend expects
    const activityLog = recentDocs.map(doc => ({
        id: doc._id,
        name: doc.name,
        role: doc.category,
        timeIn: new Date(doc.createdAt).toLocaleDateString(),
        timeOut: 'N/A', // Docs don't have timeout, but we need to match table structure or update frontend
        status: 'Uploaded',
        statusColor: 'bg-green-100 text-green-700'
    }));

    res.status(200).json(activityLog);
});

module.exports = {
    getDashboardStats,
    getRecentActivity,
};
