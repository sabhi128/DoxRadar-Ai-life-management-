const { google } = require('googleapis');
const asyncHandler = require('express-async-handler');
const prisma = require('../prismaClient');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// @desc    Get Google Auth URL
// @route   GET /api/auth/google
// @access  Private
const getGoogleAuthUrl = asyncHandler(async (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Important to get refresh token
        scope: scopes,
        prompt: 'consent', // Force consent to ensure refresh token is provided
        state: req.user.id // Pass userId in state to identify user on callback
    });

    res.status(200).json({ url });
});

// Helper to get the base URL
const getFrontendUrl = (req) => {
    // 1. Explicitly set env variable
    if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
    // 2. Vercel specific headers/host detection
    const host = req.get('host');
    if (host && host.includes('vercel.app')) {
        return `https://${host}`;
    }
    // 3. True absolute fallback for local development
    return 'http://localhost:5173';
};

// @desc    Google Auth Callback
// @route   GET /api/auth/google/callback
// @access  Public (identified via state)
const googleCallback = asyncHandler(async (req, res) => {
    const { code, state } = req.query;
    const userId = state;
    const frontendUrl = getFrontendUrl(req);

    if (!code || !userId) {
        return res.redirect(`${frontendUrl}/dashboard?error=gmail_auth_failed`);
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);

        // Get user info to store the email
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        // Save tokens to DB
        await prisma.gmailToken.upsert({
            where: { userId: userId },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || undefined, // Refresh token is only sent first time or on 'consent'
                expiryDate: new Date(tokens.expiry_date),
                email: userInfo.data.email
            },
            create: {
                userId: userId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || '',
                expiryDate: new Date(tokens.expiry_date),
                email: userInfo.data.email
            }
        });

        res.redirect(`${frontendUrl}/dashboard?gmail=connected`);
    } catch (error) {
        console.error('Google Auth Error:', error.message);
        res.redirect(`${frontendUrl}/dashboard?error=gmail_token_error`);
    }
});

// @desc    Disconnect Gmail
// @route   POST /api/auth/google/disconnect
// @access  Private
const disconnectGmail = asyncHandler(async (req, res) => {
    try {
        await prisma.gmailToken.delete({
            where: { userId: req.user.id }
        });

        // Also optionally clear `lastGmailIngestionAt` so if they reconnect, it starts fresh?
        // Usually, leaving it is fine so we don't re-ingest old emails, but let's clear it
        // so it behaves like a fresh connection if they re-link.
        await prisma.user.update({
            where: { id: req.user.id },
            data: { lastGmailIngestionAt: null }
        });

        res.status(200).json({ message: 'Gmail disconnected successfully' });
    } catch (error) {
        // If the record doesn't exist, it might throw an error, we can just say success
        if (error.code === 'P2025') {
            return res.status(200).json({ message: 'Gmail already disconnected' });
        }
        res.status(500).json({ message: 'Failed to disconnect Gmail' });
    }
});

module.exports = {
    getGoogleAuthUrl,
    googleCallback,
    disconnectGmail
};
