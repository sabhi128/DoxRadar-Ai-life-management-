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

    const updatedSubscription = await prisma.subscription.update({
        where: { id: req.params.id },
        data: {
            ...req.body,
            price: req.body.price ? parseFloat(req.body.price) : undefined,
        },
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
