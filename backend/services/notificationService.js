const prisma = require('../prismaClient');

/**
 * Creates a notification for a user.
 */
const createNotification = async (userId, data) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId: userId,
                type: data.type || 'info', // info, success, warning, danger
                title: data.title,
                message: data.message,
                metadata: data.metadata || {}
            }
        });
        console.log(`[NotificationService] Created notification: ${data.title} for user ${userId}`);
        return notification;
    } catch (error) {
        console.error("[NotificationService] Error creating notification:", error.message);
        return null;
    }
};

/**
 * Marks a notification as read.
 */
const markAsRead = async (notificationId) => {
    return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
    });
};

module.exports = {
    createNotification,
    markAsRead
};
