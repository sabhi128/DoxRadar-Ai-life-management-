const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');
const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Decode the JWT to get user info
            // For Supabase JWTs, verify with the JWT secret or decode to get sub (user id)
            let userId, userEmail;

            try {
                // Try verifying with Supabase JWT secret if available
                const jwtSecret = process.env.SUPABASE_JWT_SECRET;
                if (jwtSecret) {
                    const decoded = jwt.verify(token, jwtSecret);
                    userId = decoded.sub;
                    userEmail = decoded.email;
                } else {
                    // Fallback: decode without verification (trust Supabase issued it)
                    const decoded = jwt.decode(token);
                    if (!decoded || !decoded.sub) {
                        throw new Error('Invalid token payload');
                    }
                    userId = decoded.sub;
                    userEmail = decoded.email;
                }
            } catch (jwtError) {
                // Last resort: try Supabase admin API
                const { data, error } = await supabase.auth.admin.getUserById(
                    jwt.decode(token)?.sub
                );
                if (error || !data?.user) {
                    console.error('Supabase Admin Auth Error:', error);
                    throw new Error('Not authorized, token failed');
                }
                userId = data.user.id;
                userEmail = data.user.email;
            }

            if (!userId) {
                throw new Error('Could not extract user from token');
            }

            // Check if user exists in local DB (Prisma), if not, create (Lazy Sync)
            let localUser = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!localUser) {
                localUser = await prisma.user.findUnique({
                    where: { email: userEmail },
                });

                if (!localUser) {
                    // Create new user in local DB
                    localUser = await prisma.user.create({
                        data: {
                            id: userId,
                            email: userEmail,
                            name: userEmail?.split('@')[0] || 'User',
                            password: 'supabase_managed',
                        },
                    });
                }
            }

            // Fetch plan via raw SQL to bypass stale Prisma client if needed
            try {
                const planResult = await prisma.$queryRaw`SELECT plan FROM "User" WHERE id = ${userId} LIMIT 1`;
                const finalPlan = planResult[0]?.plan || 'Free';
                console.log(`[AUTH] User ${userId} plan from DB:`, finalPlan);
                localUser.plan = finalPlan;
            } catch (rawError) {
                console.warn('[AUTH] Fallback plan fetching failed:', rawError.message);
                localUser.plan = localUser.plan || 'Free';
            }

            req.user = localUser;
            next();
        } catch (error) {
            console.error('--- AUTH ERROR ---');
            console.error('Type:', error.constructor.name);
            console.error('Code:', error.code);
            console.error('Message:', error.message);

            // Detailed Prisma Connection error handling
            const isPrismaError = error.message.includes('Prisma') || error.code?.startsWith('P');
            const isConnectionError = error.message.includes('Can\'t reach database') ||
                error.message.includes('P1001') ||
                error.message.includes('timed out') ||
                error.message.includes('Connection refused');

            if (isPrismaError && isConnectionError) {
                res.status(503);
                return res.json({
                    error: 'DATABASE_CONNECTION_ERROR',
                    code: error.code || 'UNKNOWN_PRISMA_CODE',
                    message: 'Your network is blocking the connection to Supabase. Port 6543 is likely restricted.'
                });
            }

            res.status(401);
            res.json({
                error: 'UNAUTHORIZED',
                message: error.message || 'Authentication failed'
            });
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

module.exports = { protect };
