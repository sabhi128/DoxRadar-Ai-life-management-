const asyncHandler = require('express-async-handler');
const prisma = require('../prismaClient');

// @desc    Get subscriptions
// @route   GET /api/subscriptions
// @access  Private
const getSubscriptions = asyncHandler(async (req, res) => {
    const subscriptions = await prisma.subscription.findMany({
        where: { userId: req.user.id },
    });
    res.status(200).json(subscriptions);
});

// @desc    Set subscription
// @route   POST /api/subscriptions
// @access  Private
const setSubscription = asyncHandler(async (req, res) => {
    if (!req.body.name || !req.body.price) {
        res.status(400);
        throw new Error('Please add a name and price');
    }

    const subscription = await prisma.subscription.create({
        data: {
            userId: req.user.id,
            name: req.body.name,
            price: parseFloat(req.body.price),
            currency: req.body.currency || 'USD',
            period: req.body.period || 'Monthly',
            category: req.body.category || 'General',
            startDate: new Date(req.body.startDate || Date.now()),
            nextPayment: new Date(req.body.nextPayment || Date.now()),
            paymentMethod: req.body.paymentMethod,
        },
    });

    res.status(201).json(subscription);
});

// @desc    Update subscription
// @route   PUT /api/subscriptions/:id
// @access  Private
const updateSubscription = asyncHandler(async (req, res) => {
    const subscription = await prisma.subscription.findUnique({
        where: { id: req.params.id },
    });

    if (!subscription) {
        res.status(404);
        throw new Error('Subscription not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    if (subscription.userId !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Build update data explicitly — only include fields that are sent
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
    if (req.body.currency !== undefined) updateData.currency = req.body.currency;
    if (req.body.period !== undefined) updateData.period = req.body.period;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.paymentMethod !== undefined) updateData.paymentMethod = req.body.paymentMethod;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.startDate) updateData.startDate = new Date(req.body.startDate);
    if (req.body.nextPayment) updateData.nextPayment = new Date(req.body.nextPayment);

    const updatedSubscription = await prisma.subscription.update({
        where: { id: req.params.id },
        data: updateData,
    });

    res.status(200).json(updatedSubscription);
});

// @desc    Delete subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private
const deleteSubscription = asyncHandler(async (req, res) => {
    const subscription = await prisma.subscription.findUnique({
        where: { id: req.params.id },
    });

    if (!subscription) {
        res.status(404);
        throw new Error('Subscription not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    if (subscription.userId !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await prisma.subscription.delete({
        where: { id: req.params.id },
    });

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getSubscriptions,
    setSubscription,
    updateSubscription,
    deleteSubscription,
};
