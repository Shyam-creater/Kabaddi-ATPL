const Looking = require('../models/Looking.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

exports.createPost = async (req, res, next) => {
    try {
        const { lookingFor, location, ground, type, matchDate, description } = req.body;

        // Basic validation
        if (!lookingFor || !location || !ground || !type || !matchDate) {
            return next(new ApiError(400, 'All fields are required'));
        }

        const newPost = await Looking.create({
            user: req.user.id,
            lookingFor,
            location,
            ground,
            type,
            matchDate,
            description
        });

        return res.status(201).json(ApiResponse.success('Looking post created successfully', newPost));
    } catch (error) {
        next(error);
    }
};


exports.getMyAllPosts = async (req, res, next) => {
  try {
    const posts = await Looking.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'user',
        select: 'name profilePicture role', // 🔥 match frontend needs
      });

    return res.status(200).json(
      ApiResponse.success('My posts fetched successfully', posts)
    );
  } catch (error) {
    next(error);
  }
};

// Get all OTHER users' posts (exclude logged-in user)
exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Looking.find({
      user: { $ne: req.user.id } // ❌ exclude my posts
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'user',
        select: 'name profilePicture role',
      });

    return res.status(200).json(
      ApiResponse.success('All posts fetched successfully', posts)
    );
  } catch (error) {
    next(error);
  }
};
