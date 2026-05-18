const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserProfile, getAllUsers, blockUser, unblockUser, deleteAccount, getBlockedUsers, getSuggestedCricketers, followUser, acceptFollowRequest, unfollowUser, getFollowers, getFollowing } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

// Public route - must be before protect middleware - MOVED below for auth context

router.use(protect);

const { body } = require('express-validator');
const validate = require('../middlewares/validate.middleware');

router.get('/suggested-cricketers', getSuggestedCricketers);
router.get('/profile', getProfile);
router.put(
    '/profile',
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('phone').optional().isMobilePhone().withMessage('Invalid phone number format'),
        body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender selection'),
        body('sports').optional().isArray().withMessage('Sports must be a list'),
        body('city').optional().trim().isLength({ min: 2 }).withMessage('City must be at least 2 characters'),
    ],
    validate,
    updateProfile
);

router.get('/blocked', getBlockedUsers);
router.post('/block/:userId', blockUser);
router.post('/unblock/:userId', unblockUser);
router.delete('/delete', deleteAccount);
router.get('/list', getAllUsers);
router.post('/follow/accept', acceptFollowRequest); // Body: { userId }
router.post('/follow/:userId', followUser);
router.post('/follower/remove', require('../controllers/user.controller').removeFollower); // Body: { userId }
router.post('/unfollow/:userId', unfollowUser);

router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

router.get('/:userId', getUserProfile);

module.exports = router;
