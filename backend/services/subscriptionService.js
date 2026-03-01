const prisma = require('../prismaClient');

/**
 * Automatically creates a subscription record based on AI analysis.
 * Shared between document uploads and Gmail ingestion.
 */
const autoLogSubscription = async (userId, analysis, sourceName) => {
    if (analysis.isSubscription === true || analysis.isSubscription === 'true') {
        console.log(`[SubscriptionService] Auto-logging subscription for user: ${userId} from source: ${sourceName}`);

        const subData = analysis.subscriptionDetails || {};

        try {
            const subscription = await prisma.subscription.create({
                data: {
                    userId: userId,
                    name: subData.name || sourceName.split('.')[0],
                    price: parseFloat(subData.price) || 0,
                    currency: subData.currency || 'USD',
                    period: subData.period || 'Monthly',
                    category: analysis.suggestedCategory || 'General',
                    startDate: new Date(),
                    nextPayment: new Date(analysis.renewalDate || analysis.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                    status: 'Active'
                }
            });
            console.log(`[SubscriptionService] Created subscription: ${subscription.name}`);

            // Emit subscription creation notification
            const { createNotification } = require('./notificationService');
            await createNotification(userId, {
                type: 'success',
                title: '💳 New Subscription Found',
                message: `Auto-logged "${subscription.name}" from your email.`
            });

            return subscription;
        } catch (error) {
            console.error("[SubscriptionService] Error creating subscription:", error.message);
            return null;
        }
    }
    return null;
};

module.exports = {
    autoLogSubscription
};
