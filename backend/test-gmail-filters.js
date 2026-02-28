const { google } = require('googleapis');
const prisma = require('./prismaClient');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const testGmail = async () => {
    try {
        const userId = '3f59bbbf-a6f6-4808-8300-3de6fb3d77ba';

        const tokenRecord = await prisma.gmailToken.findUnique({
            where: { userId }
        });

        oauth2Client.setCredentials({
            access_token: tokenRecord.accessToken,
            refresh_token: tokenRecord.refreshToken
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        console.log("1. Testing query: label:UNREAD");
        const res1 = await gmail.users.messages.list({
            userId: 'me',
            q: 'label:UNREAD'
        });
        console.log(`Found ${res1.data.messages ? res1.data.messages.length : 0} unread messages.`);

        console.log("\n2. Testing query: after:1772114920 (Last Ingestion Timestamp)");
        const res2 = await gmail.users.messages.list({
            userId: 'me',
            q: 'after:1772114920'
        });
        console.log(`Found ${res2.data.messages ? res2.data.messages.length : 0} messages after the timestamp.`);

        if (res1.data.messages && res1.data.messages.length > 0) {
            console.log("\nFetching internalDate of the most recent unread message...");
            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: res1.data.messages[0].id
            });
            console.log(`Internal Date (ms): ${msg.data.internalDate}`);
            console.log(`Internal Date (unix sec): ${Math.floor(Number(msg.data.internalDate) / 1000)}`);
        }

    } catch (e) {
        console.error(e);
    }
};

testGmail();
