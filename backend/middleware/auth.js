exports.isAuthenticated = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Login required"
        });
    }
    req.user = req.session.user; 
    next();
};