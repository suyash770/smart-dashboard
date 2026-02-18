const protect = (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user;
        next();
    } else {
        res.status(401).json({ message: 'Not authorized, no session' });
    }
};

module.exports = { protect };
