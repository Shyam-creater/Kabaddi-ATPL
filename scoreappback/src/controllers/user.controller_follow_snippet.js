
// --- Follow System ---

// 1. Follow User
exports.followUser = async (req, res, next) => {
    try {
        const { userId } = req.params; // Target user to follow

        if (userId === req.user.id) {
            return next(new ApiError(400, "You cannot follow yourself"));
        }

        const targetUser = await User.findById(userId);
        const currentUser = await User.findById(req.user.id);

        if (!targetUser || !currentUser) {
            return next(new ApiError(404, "User not found"));
        }

        // Check if already following
        const isFollowing = currentUser.following.find(f => f.user.toString() === userId);
        if (isFollowing) {
            return next(new ApiError(400, "Already following or requested"));
        }

        // Add to current user's following list (pending)
        currentUser.following.push({ user: userId, status: 'pending' });
        await currentUser.save();

        // Add to target user's followers list (pending)
        targetUser.followers.push({ user: req.user.id, status: 'pending' });
        await targetUser.save();

        return res.status(200).json(ApiResponse.success('Follow request sent successfully'));
    } catch (error) {
        next(error);
    }
};

// 2. Accept Follow Request
exports.acceptFollowRequest = async (req, res, next) => {
    try {
        const { userId } = req.body; // User ID who sent the request (the follower)

        const currentUser = await User.findById(req.user.id);
        const followerUser = await User.findById(userId);

        if (!currentUser || !followerUser) {
            return next(new ApiError(404, "User not found"));
        }

        // Find the request in current user's followers list
        const followerIndex = currentUser.followers.findIndex(f => f.user.toString() === userId && f.status === 'pending');
        if (followerIndex === -1) {
            return next(new ApiError(404, "No pending follow request found from this user"));
        }

        // Update status to accepted for current user
        currentUser.followers[followerIndex].status = 'accepted';
        await currentUser.save();

        // Update status to accepted for the follower's following list
        const followingIndex = followerUser.following.findIndex(f => f.user.toString() === req.user.id);
        if (followingIndex !== -1) {
            followerUser.following[followingIndex].status = 'accepted';
            await followerUser.save();
        }

        return res.status(200).json(ApiResponse.success('Follow request accepted'));

    } catch (error) {
        next(error);
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
        currentUser.following = currentUser.following.filter(f => f.user.toString() !== userId);
        await currentUser.save();

        // Remove from target user's followers
        targetUser.followers = targetUser.followers.filter(f => f.user.toString() !== req.user.id);
        await targetUser.save();

        return res.status(200).json(ApiResponse.success('Unfollowed successfully'));
    } catch (error) {
        next(error);
    }
};

// 4. Get Suggested Cricketers (for Home Tab)
exports.getSuggestedCricketers = async (req, res, next) => {
    try {
        // Find users who have 'Cricket' in sports and are NOT current user
        // Also exclude users already followed
        const currentUser = req.user ? await User.findById(req.user.id) : null;

        let excludeIds = [];
        if (currentUser) {
            excludeIds = [currentUser._id, ...currentUser.following.map(f => f.user)];
        }

        const suggested = await User.find({
            _id: { $nin: excludeIds },
            sports: { $in: ['Cricket'] },
            role: { $ne: 'admin' }
        })
            .select('name profilePicture playerProfile.cricket.role playerProfile.cricket.country')
            .limit(10); // Show top 10

        // Map to simpler structure
        const result = suggested.map(u => ({
            _id: u._id,
            name: u.name,
            image: u.profilePicture,
            role: u.playerProfile?.cricket?.role || 'Cricketer',
            rank: Math.floor(Math.random() * 100) + 1, // Mock rank for now
            type: 'image'
        }));

        return res.status(200).json(ApiResponse.success('Suggested cricketers fetched', result));
    } catch (error) {
        next(error);
    }
};
