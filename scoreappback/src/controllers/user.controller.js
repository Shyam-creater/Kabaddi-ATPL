const User = require('../models/User.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

exports.getBlockedUsers = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('blockedUsers', 'name profilePicture');

        if (!user) {
            return next(new ApiError(404, 'User not found'));
        }

        return res.status(200).json(ApiResponse.success('Blocked users fetched', user.blockedUsers));
    } catch (error) {
        next(error);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return next(new ApiError(404, 'User not found'));

        const userObj = user.toObject();
        if (userObj.followers) userObj.followers = userObj.followers.filter(f => f.status === 'accepted');
        if (userObj.following) userObj.following = userObj.following.filter(f => f.status === 'accepted');

        return res.status(200).json(ApiResponse.success('Profile fetched', userObj));
    } catch (error) {
        next(error);
    }
};

const fs = require('fs');
const path = require('path');

exports.updateProfile = async (req, res, next) => {
    try {
        const { name, phone, city, address, gender, dob, profilePicture, sports } = req.body;

        // Log to file for debugging
        const logPath = path.join(__dirname, '../../backend_debug.log');
        const logEntry = `\n[${new Date().toISOString()}] Update Request: name=${name}, sports=${JSON.stringify(sports)}`;
        fs.appendFileSync(logPath, logEntry);

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name,
                phone,
                city,
                address,
                gender,
                dob,
                profilePicture, // Correct field name
                sports,
                playerProfile: req.body.playerProfile // Allow updating the nested profile
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return next(new ApiError(404, 'User not found'));

        return res.status(200).json(ApiResponse.success('Profile updated', user));
    } catch (error) {
        // Log error to file
        const logPath = path.join(__dirname, '../../backend_debug.log');
        const errorEntry = `\n[${new Date().toISOString()}] Error: ${error.message}`;
        fs.appendFileSync(logPath, errorEntry);
        next(error);
    }
};

/**
 * Get another user's public profile by ID
 */
exports.getUserProfile = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('name profilePicture city address gender sports role dob phone playerProfile');

        if (!user) {
            return next(new ApiError(404, 'User not found'));
        }

        let isFollowing = false;
        let isRequested = false;
        let followStatus = 'none';

        if (req.user) {
            const currentUser = await User.findById(req.user.id);
            if (currentUser && currentUser.following) {
                const followEntry = currentUser.following.find(f => f.user.toString() === userId);
                if (followEntry) {
                    followStatus = followEntry.status;
                    if (followEntry.status === 'accepted') isFollowing = true;
                    if (followEntry.status === 'pending') isRequested = true;
                }
            }
        }

        const userObj = user.toObject();
        if (userObj.followers) userObj.followers = userObj.followers.filter(f => f.status === 'accepted');
        if (userObj.following) userObj.following = userObj.following.filter(f => f.status === 'accepted');

        return res.status(200).json(ApiResponse.success('User profile fetched', { ...userObj, isFollowing, isRequested, followStatus }));
    } catch (error) {
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const { sport, page = 1, limit = 20 } = req.query;
        let query = {
            role: { $ne: 'admin' }  // Exclude admin users from public lists
        };

        if (sport && sport !== 'All') {
            query.sports = { $in: [sport] };
        }

        // Filter out current user and blocked users if logged in
        if (req.user) {
            const currentUser = await User.findById(req.user.id);
            let excludeIds = [req.user.id]; // Exclude current user

            if (currentUser && currentUser.blockedUsers && currentUser.blockedUsers.length > 0) {
                excludeIds = [...excludeIds, ...currentUser.blockedUsers];
            }

            query._id = { $nin: excludeIds };
        }

        const users = await User.find(query)
            .select('name profilePicture city address sports role playerProfile')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        return res.status(200).json(ApiResponse.success('Users fetched', users));
    } catch (error) {
        next(error);
    }
};

exports.blockUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (userId === req.user.id) {
            return next(new ApiError(400, "You cannot block yourself"));
        }

        const user = await User.findById(req.user.id);
        if (!user.blockedUsers.includes(userId)) {
            user.blockedUsers.push(userId);
            await user.save();
        }

        return res.status(200).json(ApiResponse.success('User blocked successfully'));
    } catch (error) {
        next(error);
    }
};

exports.deleteAccount = async (req, res, next) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        return res.status(200).json(ApiResponse.success('Account deleted successfully'));
    } catch (error) {
        next(error);
    }
};

exports.unblockUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(req.user.id);
        if (user.blockedUsers.includes(userId)) {
            user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId);
            await user.save();
        }

        return res.status(200).json(ApiResponse.success('User unblocked successfully'));
    } catch (error) {
        next(error);
    }
};

// --- Follow System ---

// 1. Follow User
exports.followUser = async (req, res, next) => {
    try {
        const { userId } = req.params; // Target user to follow

        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../../backend_debug.log');
        const log = (msg) => {
            try { fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] FOLLOW: ${msg}`); } catch (e) { }
        };

        log(`Request from ${req.user.id} to follow ${userId}`);

        if (userId === req.user.id) {
            log('User tried to follow self');
            return next(new ApiError(400, "You cannot follow yourself"));
        }

        const targetUser = await User.findById(userId);
        const currentUser = await User.findById(req.user.id);

        if (!targetUser || !currentUser) {
            log('User not found');
            return next(new ApiError(404, "User not found"));
        }

        // Check if already following
        // Added safety check for nulls
        const isFollowing = currentUser.following.find(f => f && f.user && f.user.toString() === userId);
        if (isFollowing) {
            log(`Already following/requested. Status: ${isFollowing.status}`);
            return next(new ApiError(400, "Already following or requested"));
        }

        // Add to current user's following list (pending)
        currentUser.following.push({ user: userId, status: 'pending' });
        await currentUser.save();

        // Add to target user's followers list (pending)
        targetUser.followers.push({ user: req.user.id, status: 'pending' });
        await targetUser.save();

        log('Saved pending status for both users');

        // Send real-time notification via Socket.IO
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        if (io && onlineUsers && onlineUsers.has(userId)) {
            io.to(onlineUsers.get(userId)).emit('followRequest', {
                from: {
                    id: req.user.id,
                    name: currentUser.name,
                    image: currentUser.profilePicture
                }
            });
            log('Socket event sent');
        }

        return res.status(200).json(ApiResponse.success('Follow request sent successfully'));
    } catch (error) {
        console.error("Follow Error:", error);
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '../../backend_debug.log');
            fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] FOLLOW ERROR: ${error.message}\nStack: ${error.stack}`);
        } catch (e) { }
        next(error);
    }
};

// 2. Accept Follow Request
// 2. Accept Follow Request
// 2. Accept Follow Request
exports.acceptFollowRequest = async (req, res, next) => {
    try {
        const { userId } = req.body; // User ID who sent the request (the follower)
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../../backend_debug.log');

        const log = (msg) => {
            try {
                fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] ${msg}`);
            } catch (e) { console.error('Log failed:', e); }
        };

        log(`Accept Follow Request: User ${req.user.id} accepting ${userId}`);

        const currentUser = await User.findById(req.user.id);
        const followerUser = await User.findById(userId);

        if (!currentUser || !followerUser) {
            log('User not found');
            return next(new ApiError(404, "User not found"));
        }

        // Find the request in current user's followers list
        const followerIndex = currentUser.followers.findIndex(f => {
            if (!f || !f.user) return false;
            return f.user.toString() === userId && f.status === 'pending';
        });

        log(`Follower Index: ${followerIndex}`);

        if (followerIndex === -1) {
            // Check if already accepted to avoid error
            const alreadyAccepted = currentUser.followers.find(f => {
                if (!f || !f.user) return false;
                return f.user.toString() === userId && f.status === 'accepted';
            });
            if (alreadyAccepted) {
                log('Already accepted');
                return res.status(200).json(ApiResponse.success('Follow request already accepted'));
            }
            log('No pending request found');
            return next(new ApiError(404, "No pending follow request found from this user"));
        }

        // Update status to accepted for current user
        if (currentUser.followers[followerIndex]) {
            currentUser.followers[followerIndex].status = 'accepted';
            await currentUser.save();
            log('Updated currentUser status');
        } else {
            log('CRITICAL: followerIndex found but element is null?');
        }

        // Update status to accepted for the follower's following list
        const followingIndex = followerUser.following.findIndex(f => {
            if (!f || !f.user) return false;
            return f.user.toString() === req.user.id;
        });
        log(`Following Index: ${followingIndex}`);

        if (followingIndex !== -1) {
            if (followerUser.following[followingIndex]) {
                followerUser.following[followingIndex].status = 'accepted';
                await followerUser.save();
                log('Updated followerUser status');
            }
        } else {
            log(`Force adding following for user ${followerUser._id} -> ${req.user.id}`);
            // If not found (integrity issue), force add it as accepted
            followerUser.following.push({ user: req.user.id, status: 'accepted' });
            await followerUser.save();
        }

        // Send real-time notification via Socket.IO
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        if (io && onlineUsers && onlineUsers.has(userId)) {
            io.to(onlineUsers.get(userId)).emit('followAccepted', {
                from: {
                    id: req.user.id,
                    name: currentUser.name,
                    image: currentUser.profilePicture
                }
            });
            log('Socket event sent');
        }

        return res.status(200).json(ApiResponse.success('Follow request accepted'));

    } catch (error) {
        // Log error to file for debugging
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '../../backend_debug.log');
            const errorEntry = `\n[${new Date().toISOString()}] Accept Follow Error: ${error.message}\nStack: ${error.stack}\n`;
            fs.appendFileSync(logPath, errorEntry);
        } catch (e) {
            console.error("Failed to write to debug log", e);
        }

        console.error("Error in acceptFollowRequest:", error); // Log internal error
        next(new ApiError(500, "Failed to accept follow request: " + error.message));
    }
};

// 2.1 Remove Follower (Force Unfollow)
exports.removeFollower = async (req, res, next) => {
    try {
        const { userId } = req.body; // User ID to remove from followers

        const currentUser = await User.findById(req.user.id);
        const targetUser = await User.findById(userId);

        if (!currentUser || !targetUser) {
            return next(new ApiError(404, "User not found"));
        }

        // Remove from current user's followers
        currentUser.followers = currentUser.followers.filter(f => f && f.user && f.user.toString() !== userId);
        await currentUser.save();

        // Remove from target user's following
        targetUser.following = targetUser.following.filter(f => f && f.user && f.user.toString() !== req.user.id);
        await targetUser.save();

        return res.status(200).json(ApiResponse.success('Follower removed successfully'));
    } catch (error) {
        console.error("Error in removeFollower:", error);
        next(new ApiError(500, "Failed to remove follower"));
    }
};

// 3. Unfollow / Cancel Request
exports.unfollowUser = async (req, res, next) => {
    try {
        const { userId } = req.params; // Target to unfollow

        const currentUser = await User.findById(req.user.id);
        const targetUser = await User.findById(userId);

        if (!currentUser || !targetUser) return next(new ApiError(404, "User not found"));

        // Remove from current user's following
        currentUser.following = currentUser.following.filter(f => f && f.user && f.user.toString() !== userId);
        await currentUser.save();

        // Remove from target user's followers
        targetUser.followers = targetUser.followers.filter(f => f && f.user && f.user.toString() !== req.user.id);
        await targetUser.save();

        return res.status(200).json(ApiResponse.success('Unfollowed successfully'));
    } catch (error) {
        next(error);
    }
};

// 4. Get Suggested Cricketers (for Home Tab)
// 4. Get Suggested Profiles (formerly Suggested Cricketers)
exports.getSuggestedCricketers = async (req, res, next) => {
    try {
        const { category } = req.query;
        // Construct query based on category
        let sportFilter = ['Cricket']; // Default
        if (category) {
            // Map frontend category names if needed, or use directly
            // User mentioned: cricket, kabaddi, football
            // Ensure case matching. 'Kabaddi' vs 'kabaddi'
            const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
            sportFilter = [formattedCategory];
        }

        // Find users who have the selected sport in sports array and are NOT current user
        // Also exclude users already followed
        const currentUser = req.user ? await User.findById(req.user.id) : null;

        let excludeIds = [];
        if (currentUser) {
            excludeIds = [currentUser._id];
            // Also exclude blocked users
            if (currentUser.blockedUsers) {
                excludeIds = [...excludeIds, ...currentUser.blockedUsers];
            }
        }

        const suggested = await User.find({
            _id: { $nin: excludeIds },
            sports: { $in: sportFilter },
            role: { $ne: 'admin' }
        })
            .select('name profilePicture playerProfile.cricket.role playerProfile.kabaddi.role playerProfile.football.role')
            .limit(10); // Show top 10

        // Map to simpler structure
        const result = suggested.map(u => {
            let role = 'Player';
            // Determine role based on category or first available
            if (u.playerProfile) {
                if (sportFilter.includes('Cricket') && u.playerProfile.cricket) role = u.playerProfile.cricket.role || 'Cricketer';
                else if (sportFilter.includes('Kabaddi') && u.playerProfile.kabaddi) role = u.playerProfile.kabaddi.role || 'Raider/Defender';
                else if (sportFilter.includes('Football') && u.playerProfile.football) role = u.playerProfile.football.role || 'Footballer';
            }

            let isFollowing = false;
            let isRequested = false;

            if (currentUser && currentUser.following) {
                // Safe check for following status
                const followEntry = currentUser.following.find(f => f && f.user && f.user.toString() === u._id.toString());
                if (followEntry) {
                    if (followEntry.status === 'accepted') isFollowing = true;
                    if (followEntry.status === 'pending') isRequested = true;
                }
            }

            return {
                _id: u._id,
                name: u.name,
                image: u.profilePicture,
                role: role,
                type: 'image',
                isFollowing,
                isRequested
            };
        });

        return res.status(200).json(ApiResponse.success('Suggested profiles fetched', result));
    } catch (error) {
        next(error);
    }
};

// 5. Get Followers List
exports.getFollowers = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate('followers.user', 'name profilePicture playerProfile.cricket.role sports');

        if (!user) return next(new ApiError(404, "User not found"));

        // Filter logic:
        // 1. Always filter out null users (e.g. deleted accounts)
        // 2. If 'includePending' is true AND requester is the owner, show all non-null.
        // 3. Otherwise, only show 'accepted'.

        const { includePending } = req.query;
        const isOwner = req.user && req.user.id === userId;

        const followers = user.followers
            .filter(f => {
                const isValidUser = f && f.user;
                if (!isValidUser) return false;

                if (includePending === 'true' && isOwner) {
                    return true; // Show all (pending + accepted)
                }
                return f.status === 'accepted'; // Default public view
            })
            .map(f => ({
                _id: f.user._id,
                name: f.user.name,
                image: f.user.profilePicture,
                role: f.user.playerProfile?.cricket?.role || 'User',
                sports: f.user.sports,
                status: f.status,
                createdAt: f.createdAt || new Date()
            }));

        return res.status(200).json(ApiResponse.success('Followers fetched', followers));
    } catch (error) {
        next(error);
    }
};

// 6. Get Following List
exports.getFollowing = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate('following.user', 'name profilePicture playerProfile.cricket.role sports');

        if (!user) return next(new ApiError(404, "User not found"));

        // Filter out any null users (e.g. deleted users) AND only show accepted following
        const following = user.following
            .filter(f => f.user && f.status === 'accepted')
            .map(f => ({
                _id: f.user._id,
                name: f.user.name,
                image: f.user.profilePicture,
                role: f.user.playerProfile?.cricket?.role || 'User',
                sports: f.user.sports,
                status: f.status,
                createdAt: f.createdAt || new Date()
            }));

        return res.status(200).json(ApiResponse.success('Following fetched', following));
    } catch (error) {
        next(error);
    }
};
