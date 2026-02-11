const mongoose = require('mongoose');

const subscriptionSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: [true, 'Please add a subscription name'],
        },
        price: {
            type: Number,
            required: [true, 'Please add a price'],
        },
        billingCycle: {
            type: String,
            enum: ['Monthly', 'Yearly'],
            default: 'Monthly',
        },
        nextBillingDate: {
            type: Date,
            required: [true, 'Please add next billing date'],
        },
        category: {
            type: String,
            default: 'General',
        },
        paymentMethod: {
            type: String,
            default: 'Credit Card',
        },
        icon: {
            type: String, // Can store an icon name or URL
            default: 'CreditCard',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
