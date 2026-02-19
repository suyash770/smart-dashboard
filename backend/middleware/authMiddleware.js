const protect = (req, res, next) => {
    // Detailed Logging for Debugging Mobile Issues
    console.log(`[AUTH CHECK] Path: ${req.path}`);
    console.log(`[AUTH CHECK] Session ID: ${req.sessionID}`);
    console.log(`[AUTH CHECK] User in Session: ${req.session?.user ? 'YES' : 'NO'}`);
    console.log(`[AUTH CHECK] Cookie Header: ${req.headers.cookie ? 'PRESENT' : 'MISSING'}`);

    if (req.session && req.session.user) {
        req.user = req.session.user;
        next();
    } else {
        console.log('[AUTH FAILURE] No active session found.');
        res.status(401).json({ message: 'Not authorized, no session' });
    }
};

module.exports = { protect };
