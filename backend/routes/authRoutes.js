const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. Check if email is valid (MX, SMTP, Typo, Disposable)
        const { validate } = require('deep-email-validator');
        // Configure validator to be less strict for dev/production stability
        const val = await validate({
            email,
            validateRegex: true,
            validateMx: false, // MX checks can fail without proper DNS
            validateTypo: false, // Typo checks can be annoying
            validateDisposable: true,
            validateSMTP: false // SMTP checks often fail from local/cloud IPs
        });

        if (!val.valid) {
            // Map specific errors if needed, or just general "does not exist"
            const reason = val.validators[val.reason]?.reason || 'Email does not exist';

            // Should we be strict? The user asked "if it is not exist then you have to say please write correct email id"
            return res.status(400).json({
                message: 'Email does not exist. Please write correct email id.'
            });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        const user = await User.create({ username, email, password });

        req.session.user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            theme: user.theme,
            createdAt: user.createdAt
        };

        res.status(201).json(req.session.user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email does not exist. Please try again.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password. Please try again.' });
        }

        req.session.user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            theme: user.theme,
            createdAt: user.createdAt
        };

        res.json(req.session.user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/auth/demo-login — Auto-login for recruiters
router.post('/demo-login', async (req, res) => {
    try {
        const demoEmail = 'demo@smartdashboard.com';
        let user = await User.findOne({ email: demoEmail });

        if (!user) {
            // Create demo user if not exists
            user = await User.create({
                username: 'Recruiter Demo',
                email: demoEmail,
                password: 'demo_password_123' // Dummy password, they use token login anyway
            });
        }

        req.session.user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            theme: user.theme,
            createdAt: user.createdAt
        };

        res.json(req.session.user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/auth/profile — update profile (avatar, theme)
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
        if (req.body.theme !== undefined) user.theme = req.body.theme;

        await user.save();

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            theme: user.theme,
            createdAt: user.createdAt,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/auth/update-password
router.put('/update-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ... (existing code)

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email could not be found' });
        }

        // Get reset token (instance method)
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const message = `
            <h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password:</p>
            <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
            <p>This link is valid for 10 minutes.</p>
        `;

        try {
            // Configure Transporter (Mock or Real)
            const transporter = nodemailer.createTransport({
                service: 'gmail', // or use host/port
                auth: {
                    user: process.env.EMAIL_USER, // Set these in .env
                    pass: process.env.EMAIL_PASS
                }
            });

            // If credentials are missing, log the link (Development Mode)
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                console.log('--- PASSWORD RESET LINK (Dev Mode) ---');
                console.log(resetUrl);
                console.log('--------------------------------------');
                return res.status(200).json({ message: 'Email sent (checked server console for link)' });
            }

            await transporter.sendMail({
                from: process.env.EMAIL_FROM || 'noreply@smartdash.com',
                to: user.email,
                subject: 'Password Reset Request',
                html: message
            });

            res.status(200).json({ message: 'Email sent' });

        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Email could not be sent' });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/auth/reset-password/:resetToken
router.put('/reset-password/:resetToken', async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: 'Password reset successful' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.json({ message: 'Logout successful' });
    });
});

// GET /api/auth/me — Check if user is logged in
router.get('/me', async (req, res) => {
    if (req.session.user) {
        return res.json(req.session.user);
    } else {
        return res.status(401).json({ message: 'Not authorized' });
    }
});

module.exports = router;
