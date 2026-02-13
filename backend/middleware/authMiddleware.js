const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');
const prisma = require('../prismaClient');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify token with Supabase
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                console.error('Supabase Auth Error:', error);
                throw new Error('Not authorized, token failed');
            }

            // Check if user exists in local DB (Prisma), if not, create (Lazy Sync)
            let localUser = await prisma.user.findUnique({
                where: { id: user.id }, // Assume ID sync
            });

            if (!localUser) {
                // Try finding by email as fallback or just create
                // Since this is a migration, we might want to sync by email if ID doesn't match
                localUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (localUser) {
                    // Update ID to match Supabase if needed? 
                    // No, existing relations rely on old ID. 
                    // Ideally we should have migrated users with their IDs to Supabase.
                    // But for now, let's assume new users or clean slate.
                } else {
                    // Create new user in local DB
                    localUser = await prisma.user.create({
                        data: {
                            id: user.id, // Keep IDs in sync
                            email: user.email,
                            name: user.user_metadata.name || user.email.split('@')[0],
                            password: 'supabase_managed', // Dummy value
                        },
                    });
                }
            }

            req.user = localUser;
            next();
        } catch (error) {
            console.error(error);
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
