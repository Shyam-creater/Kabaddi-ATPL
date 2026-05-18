
// 5. Get Followers List
exports.getFollowers = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate('followers.user', 'name profilePicture playerProfile.cricket.role');

        if (!user) return next(new ApiError(404, "User not found"));

        const followers = user.followers.map(f => ({
            _id: f.user._id,
            name: f.user.name,
            image: f.user.profilePicture,
            role: f.user.playerProfile?.cricket?.role || 'User',
            status: f.status
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
        const user = await User.findById(userId).populate('following.user', 'name profilePicture playerProfile.cricket.role');

        if (!user) return next(new ApiError(404, "User not found"));

        const following = user.following.map(f => ({
            _id: f.user._id,
            name: f.user.name,
            image: f.user.profilePicture,
            role: f.user.playerProfile?.cricket?.role || 'User',
            status: f.status
        }));

        return res.status(200).json(ApiResponse.success('Following fetched', following));
    } catch (error) {
        next(error);
    }
};
