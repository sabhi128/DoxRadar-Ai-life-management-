const asyncHandler = require('express-async-handler');
const Subscription = require('../models/Subscription');

// @desc    Get subscriptions
// @route   GET /api/subscriptions
// @access  Private
const getSubscriptions = asyncHandler(async (req, res) => {
    const subscriptions = await Subscription.find({ user: req.user.id });
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

    const subscription = await Subscription.create({
        user: req.user.id,
        name: req.body.name,
        price: req.body.price,
        billingCycle: req.body.billingCycle,
        nextBillingDate: req.body.nextBillingDate,
        category: req.body.category,
        paymentMethod: req.body.paymentMethod,
    });

    res.status(201).json(subscription);
});

// @desc    Update subscription
// @route   PUT /api/subscriptions/:id
// @access  Private
const updateSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
        res.status(404);
        throw new Error('Subscription not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    if (subscription.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.status(200).json(updatedSubscription);
});

// @desc    Delete subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private
const deleteSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
        res.status(404);
        throw new Error('Subscription not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    if (subscription.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await subscription.deleteOne();

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getSubscriptions,
    setSubscription,
    updateSubscription,
    deleteSubscription,
};
