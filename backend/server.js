const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load env vars
dotenv.config();

const app = express();

const compression = require('compression');

// Middleware
app.use(compression());
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

// Import Routes
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const lifeAuditRoutes = require('./routes/lifeAuditRoutes');
const userRoutes = require('./routes/userRoutes');
const incomeRoutes = require('./routes/incomeRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/life-audit', lifeAuditRoutes);
app.use('/api/users', userRoutes);
app.use('/api/income', incomeRoutes);

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
