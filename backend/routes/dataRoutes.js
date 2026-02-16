const express = require('express');
const router = express.Router();
const Data = require('../models/Data');
const { protect } = require('../middleware/authMiddleware');

// Reusable helper: call AI engine (supports http & https via env)
const callAIEngine = (path, payload) => {
    return new Promise((resolve, reject) => {
        const aiUrl = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5001';
        const url = new URL(path, aiUrl);
        const isHttps = url.protocol === 'https:';
        const lib = require(isHttps ? 'https' : 'http');

        const aiReq = lib.request({
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (aiRes) => {
            let body = '';
            aiRes.on('data', chunk => body += chunk);
            aiRes.on('end', () => {
                if (aiRes.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    try {
                        reject(new Error(JSON.parse(body).error || 'AI Engine error'));
                    } catch {
                        reject(new Error('AI Engine error'));
                    }
                }
            });
        });
        aiReq.on('error', () => reject(new Error('AI Engine is not running')));
        aiReq.write(payload);
        aiReq.end();
    });
};

// GET all data (for the logged-in user)
router.get('/', protect, async (req, res) => {
    try {
        const allData = await Data.find({ user: req.user._id }).sort({ date: -1 });
        res.json(allData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new data (for the logged-in user)
router.post('/add', protect, async (req, res) => {
    const newData = new Data({
        label: req.body.label,
        value: req.body.value,
        category: req.body.category,
        user: req.user._id
    });

    try {
        const savedData = await newData.save();
        res.status(201).json(savedData);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT (edit) data entry (only if owned by the logged-in user)
router.put('/:id', protect, async (req, res) => {
    try {
        const entry = await Data.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        if (entry.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this entry' });
        }
        const { label, value, category } = req.body;
        if (label !== undefined) entry.label = label;
        if (value !== undefined) entry.value = value;
        if (category !== undefined) entry.category = category;
        const updated = await entry.save();
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE data entry (only if owned by the logged-in user)
router.delete('/:id', protect, async (req, res) => {
    try {
        const entry = await Data.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        if (entry.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this entry' });
        }
        await Data.findByIdAndDelete(req.params.id);
        res.json({ message: 'Entry deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/predict', protect, async (req, res) => {
    try {
        // Build filter — optionally filter by category
        const filter = { user: req.user._id };
        if (req.query.category) {
            filter.category = req.query.category;
        }

        const userData = await Data.find(filter).sort({ date: 1 });

        if (userData.length < 2) {
            return res.status(400).json({
                message: `Need at least 2 data entries${req.query.category ? ` in "${req.query.category}"` : ''} to make predictions. Add more data first!`
            });
        }

        // Send data to Flask AI engine
        const payload = JSON.stringify({
            data: userData.map(d => ({ value: d.value, label: d.label }))
        });

        const aiResponse = await callAIEngine('/predict', payload);

        res.json({
            category: req.query.category || 'All',
            original: userData.map(d => ({ label: d.label, value: d.value, category: d.category })),
            predictions: aiResponse.predictions,
            model: aiResponse.model
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET AI insights for all categories
router.get('/insights', protect, async (req, res) => {
    try {
        const userData = await Data.find({ user: req.user._id }).sort({ date: 1 });

        if (userData.length < 2) {
            return res.status(400).json({
                message: 'Need at least 2 data entries to generate insights.'
            });
        }

        // Group by category
        const categories = {};
        userData.forEach(d => {
            if (!categories[d.category]) categories[d.category] = [];
            categories[d.category].push({ value: d.value, label: d.label, date: d.date });
        });

        const payload = JSON.stringify({ categories });

        const aiResponse = await callAIEngine('/insights', payload);

        res.json(aiResponse);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET cross-category correlations
router.get('/correlations', protect, async (req, res) => {
    try {
        const userData = await Data.find({ user: req.user._id }).sort({ date: 1 });

        if (userData.length < 4) {
            return res.status(400).json({
                message: 'Need more data across multiple categories to find correlations.'
            });
        }

        // Group by category
        const categories = {};
        userData.forEach(d => {
            if (!categories[d.category]) categories[d.category] = [];
            categories[d.category].push({ value: d.value, label: d.label, date: d.date });
        });

        const payload = JSON.stringify({ categories });

        const aiResponse = await callAIEngine('/correlations', payload);

        res.json(aiResponse);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET What-If simulation with growth multiplier
router.get('/simulate', protect, async (req, res) => {
    try {
        const filter = { user: req.user._id };
        if (req.query.category) filter.category = req.query.category;
        const multiplier = parseFloat(req.query.multiplier) || 1.0;

        const userData = await Data.find(filter).sort({ date: 1 });

        if (userData.length < 2) {
            return res.status(400).json({
                message: `Need at least 2 data entries to simulate.`
            });
        }

        const payload = JSON.stringify({
            data: userData.map(d => ({ value: d.value, label: d.label })),
            multiplier
        });

        const aiResponse = await callAIEngine('/simulate', payload);

        res.json({
            category: req.query.category || 'All',
            original: userData.map(d => ({ label: d.label, value: d.value })),
            predictions: aiResponse.original,
            projected: aiResponse.projected,
            multiplier: aiResponse.multiplier,
            model: aiResponse.model
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET KPI comparison: last 7 days vs previous 7 days
router.get('/kpi-comparison', protect, async (req, res) => {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

        const recentData = await Data.find({
            user: req.user._id,
            date: { $gte: sevenDaysAgo, $lte: now }
        });

        const previousData = await Data.find({
            user: req.user._id,
            date: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
        });

        const sum = (arr) => arr.reduce((s, d) => s + d.value, 0);
        const avg = (arr) => arr.length > 0 ? sum(arr) / arr.length : 0;

        const recentTotal = sum(recentData);
        const prevTotal = sum(previousData);
        const recentAvg = avg(recentData);
        const prevAvg = avg(previousData);

        const pctChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return parseFloat(((current - previous) / Math.abs(previous) * 100).toFixed(1));
        };

        res.json({
            recent: {
                entries: recentData.length,
                totalValue: parseFloat(recentTotal.toFixed(2)),
                average: parseFloat(recentAvg.toFixed(2)),
            },
            previous: {
                entries: previousData.length,
                totalValue: parseFloat(prevTotal.toFixed(2)),
                average: parseFloat(prevAvg.toFixed(2)),
            },
            changes: {
                entries: pctChange(recentData.length, previousData.length),
                totalValue: pctChange(recentTotal, prevTotal),
                average: pctChange(recentAvg, prevAvg),
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;