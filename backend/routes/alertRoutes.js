const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// GET all active alerts for user
router.get('/', protect, async (req, res) => {
    try {
        const alerts = await Alert.find({ user: req.user._id });
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create new alert
router.post('/', protect, async (req, res) => {
    try {
        const { category, condition, threshold } = req.body;
        const alert = new Alert({
            user: req.user._id,
            category,
            condition,
            threshold
        });
        const savedAlert = await alert.save();
        res.status(201).json(savedAlert);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE alert
router.delete('/:id', protect, async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (!alert) return res.status(404).json({ message: 'Alert not found' });
        if (alert.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await Alert.findByIdAndDelete(req.params.id);
        res.json({ message: 'Alert deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET notifications
router.get('/notifications', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort({ date: -1 }).limit(20);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT mark notification as read
router.put('/notifications/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (notification && notification.user.toString() === req.user._id.toString()) {
            notification.read = true;
            await notification.save();
            res.json(notification);
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
