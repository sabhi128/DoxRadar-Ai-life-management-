const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all for now to debug, restrict later
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// CSP to allow Supabase images/PDFs
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; img-src 'self' data: https://*.supabase.co https://*.supabase.in; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );
    next();
});

// Basic route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// TEMPORARY: Debug endpoint to check env vars on Vercel (remove after debugging)
app.get('/api/debug-env', (req, res) => {
    res.json({
        OPENROUTER_API_KEY_SET: !!process.env.OPENROUTER_API_KEY,
        OPENROUTER_API_KEY_LENGTH: process.env.OPENROUTER_API_KEY?.length || 0,
        ENABLE_AI_ANALYSIS: process.env.ENABLE_AI_ANALYSIS,
        NODE_ENV: process.env.NODE_ENV,
        SUPABASE_URL_SET: !!process.env.SUPABASE_URL,
        ALL_ENV_KEYS_WITH_OPEN: Object.keys(process.env).filter(k => k.toUpperCase().includes('OPEN')),
        ALL_ENV_KEYS_WITH_AI: Object.keys(process.env).filter(k => k.toUpperCase().includes('AI')),
        ALL_ENV_KEYS_WITH_ROUTER: Object.keys(process.env).filter(k => k.toUpperCase().includes('ROUTER')),
    });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const lifeAuditRoutes = require('./routes/lifeAuditRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/life-audit', lifeAuditRoutes);

// Serve uploads
app.use('/uploads', express.static('uploads'));

const { errorHandler } = require('./middleware/errorMiddleware');
app.use(errorHandler);


const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
}

module.exports = app;
