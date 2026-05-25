const ApiError = require('../utils/ApiError');

exports.isVendorAuth = (req, res, next) => {
    // Basic stub for vendor auth - usually validates a token or role
    if (req.user && (req.user.role === 'vendor' || req.user.role === 'admin')) {
        next();
    } else {
        return next(new ApiError(403, 'Vendor access required'));
    }
};

exports.isVerifiedVendor = (req, res, next) => {
    // Stub for checking if vendor is verified
    next();
};
