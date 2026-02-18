const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL, 'http://localhost:3000']
        : '*',
    credentials: true
}));
app.use(express.json({ limit: '2mb' }));

// Session Configuration
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');

app.set('trust proxy', 1); // Required for Render/Heroku to trust the proxy and set secure cookies

app.use(session({
    secret: process.env.JWT_SECRET || 'smartdashboard_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true required for SameSite: None
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Cross-site cookie
    }
}));

const dataRoutes = require('./routes/dataRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/data', dataRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/alerts', require('./routes/alertRoutes'));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Database Connection with retry
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            bufferTimeoutMS: 30000
        });
        console.log("✅ MongoDB Connected!");
    } catch (err) {
        console.log("❌ DB Connection Error:", err.message);
        console.log("⏳ Retrying in 5 seconds...");
        setTimeout(connectDB, 5000);
    }
};

connectDB();

const Data = require('./models/Data'); // Ensure Data model is imported

app.get('/', (req, res) => {
    res.send("API is running!");
});

// Public Stats Endpoint for Landing Page
app.get('/api/stats', async (req, res) => {
    try {
        const count = await Data.countDocuments();
        res.json({
            predictionsCount: count,
            status: 'operational',
            latency: Math.floor(Math.random() * 50) + 120 // Simulated latency variance 120-170ms
        });
    } catch (err) {
        res.status(500).json({ status: 'degraded', error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});