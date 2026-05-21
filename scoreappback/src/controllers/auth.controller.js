const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res, next) => {
    try {
        const { name, email, phone, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return next(new ApiError(400, 'Email already registered'));

        const user = await User.create({ name, email, phone, password });

        const token = generateToken(user._id);
        return res.status(201).json(ApiResponse.success('User registered', { token, user }));
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password, loginType } = req.body; // loginType: 'user' or 'admin'
        const user = await User.findOne({ email });
        if (!user) return next(new ApiError(404, 'Email not found'));

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return next(new ApiError(401, 'Invalid password'));

        // Role-based login restrictions
        if (loginType === 'admin') {
            // Admin panel login - only allow admin or super_admin role
            if (user.role !== 'admin' && user.role !== 'super_admin') {
                return next(new ApiError(403, 'Access denied. Admin privileges required.'));
            }
        } else {
            // User app login - don't allow admin or super_admin role
            if (user.role === 'admin' || user.role === 'super_admin') {
                return next(new ApiError(403, 'Admin accounts cannot login to user app. Please use admin panel.'));
            }
        }

        const token = generateToken(user._id);
        return res.status(200).json(ApiResponse.success('Login successful', { token, user }));
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return next(new ApiError(404, 'User not found'));

        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) return next(new ApiError(400, 'Incorrect current password'));

        // Update to new password (hashing handled by pre-save hook)
        user.password = newPassword;
        await user.save();

        return res.status(200).json(ApiResponse.success('Password changed successfully'));
    } catch (error) {
        next(error);
    }
};

exports.thSignup = async (req, res, next) => {
    try {
        const { name, email, phone, city, address, password, profilePicture } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return next(new ApiError(400, 'Email already registered'));

        // For TH, role is strictly 'TH'
        const user = await User.create({ 
            name, 
            email, 
            phone, 
            city,
            address,
            password, 
            profilePicture: profilePicture || '',
            role: 'TH',
            status: 'pending' // Require admin approval or email verification if needed
        });

        const token = generateToken(user._id);
        return res.status(201).json(ApiResponse.success('Tournament Head registered successfully', { token, user }));
    } catch (error) {
        next(error);
    }
};

exports.thLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return next(new ApiError(404, 'Email not found'));

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return next(new ApiError(401, 'Invalid password'));

        if (user.role !== 'TH' && user.role !== 'admin' && user.role !== 'scorer') {
            return next(new ApiError(403, 'Access denied. Tournament Head or Scorer privileges required.'));
        }

        if (user.status !== 'active') {
            return next(new ApiError(403, 'Account is not active. Please wait for approval or contact your Tournament Head.'));
        }

        const token = generateToken(user._id);
        return res.status(200).json(ApiResponse.success('Login successful', { token, user }));
    } catch (error) {
        next(error);
    }
};
