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

            req.user = localUser;
            next();
        } catch (error) {
            console.error('Auth Error:', error.message);
            res.status(401);
            throw new Error('Not authorized');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

module.exports = { protect };
