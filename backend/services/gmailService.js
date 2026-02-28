const { google } = require('googleapis');
const prisma = require('../prismaClient');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

/**
 * Ensures valid tokens for a user, refreshes if necessary.
 */
const getValidAuth = async (userId) => {
    const tokenRecord = await prisma.gmailToken.findUnique({
        where: { userId }
    });

    if (!tokenRecord) {
        throw new Error('No Gmail token found for user');
    }

    oauth2Client.setCredentials({
        access_token: tokenRecord.accessToken,
        refresh_token: tokenRecord.refreshToken,
        expiry_date: tokenRecord.expiryDate.getTime()
    });

    // Check if expired
    if (Date.now() >= tokenRecord.expiryDate.getTime() - 60000) { // 1 min buffer
        console.log(`[GmailService] Refreshing token for user: ${userId}`);
        const { credentials } = await oauth2Client.refreshAccessToken();

        await prisma.gmailToken.update({
            where: { userId },
            data: {
                accessToken: credentials.access_token,
                refreshToken: credentials.refresh_token || tokenRecord.refreshToken, // Google might not send refresh token again
                expiryDate: new Date(credentials.expiry_date)
            }
        });
        oauth2Client.setCredentials(credentials);
    }

    return oauth2Client;
};

/**
 * Fetches unread emails for a specific user.
 */
const fetchUnreadEmails = async (userId) => {
    try {
        const auth = await getValidAuth(userId);
        const gmail = google.gmail({ version: 'v1', auth });

        // Get unread messages (label:UNREAD)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastGmailIngestionAt: true }
        });

        // 1. Fetch ALL unread emails
        let query = 'label:UNREAD';
        console.log(`[GmailService] Executing query: ${query}`);

        const res = await gmail.users.messages.list({
            userId: 'me',
            q: query
        });

        if (!res.data.messages || res.data.messages.length === 0) {
            return [];
        }

        // 2. Fetch full message bodies and filter them LOCALLY by exact millisecond
        const emails = [];
        const lastIngestionMs = user.lastGmailIngestionAt ? (user.lastGmailIngestionAt.getTime() - (2 * 60 * 60 * 1000)) : 0; // 2 hour buffer

        for (const msg of res.data.messages) {
            const fullMsg = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id
            });

            // Gmail's internalDate is absolute milliseconds since epoch
            const emailTimeMs = Number(fullMsg.data.internalDate);

            if (emailTimeMs >= lastIngestionMs) {
                emails.push(fullMsg.data);
            }
        }

        return emails;
    } catch (error) {
        console.error(`[GmailService] Error fetching for ${userId}:`, error.message);
        throw error;
    }
};

/**
 * Updates the last ingestion timestamp for a user.
 */
const updateLastIngestion = async (userId) => {
    await prisma.user.update({
        where: { id: userId },
        data: { lastGmailIngestionAt: new Date() }
    });
};

/**
 * Fetches an attachment by ID.
 */
const getAttachment = async (userId, messageId, attachmentId) => {
    try {
        const auth = await getValidAuth(userId);
        const gmail = google.gmail({ version: 'v1', auth });

        const res = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: messageId,
            id: attachmentId
        });

        return res.data;
    } catch (error) {
        console.error(`[GmailService] Attachment error for ${userId}:`, error.message);
        return null;
    }
};

module.exports = {
    fetchUnreadEmails,
    updateLastIngestion,
    getAttachment
};
