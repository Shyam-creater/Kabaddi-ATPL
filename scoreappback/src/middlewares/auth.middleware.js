const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return next(new ApiError(401, 'Not authorized, token missing'));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return next(new ApiError(401, 'User not found'));
        }
        req.user = user;
        next();
    } catch (error) {
        return next(new ApiError(401, 'Not authorized, token failed'));
    }
};

exports.adminOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        return next(new ApiError(403, 'Administrator access required'));
    }
};

exports.thOnly = (req, res, next) => {
    if (req.user && req.user.role === 'TH') {
        next();
    } else {
        return next(new ApiError(403, 'Tournament Head access required'));
    }
};

exports.adminOrTH = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'TH' || req.user.role === 'scorer')) {
        next();
    } else {
        return next(new ApiError(403, 'Administrator, Tournament Head, or Scorer access required'));
    }
};

exports.adminSuperAdminOrTH = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'TH')) {
        next();
    } else {
        return next(new ApiError(403, 'Administrator or Tournament Head access required'));
    }
};
