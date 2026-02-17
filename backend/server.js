const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://smart-dashboard-silk.vercel.app',
        'https://smartdash-ai.onrender.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));


const dataRoutes = require('./routes/dataRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/data', dataRoutes);
app.use('/api/auth', authRoutes);

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

app.get('/', (req, res) => {
    res.send("API is running!");
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});