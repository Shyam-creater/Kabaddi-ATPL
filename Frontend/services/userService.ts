import api from './api';

export const userService = {
    followUser: (userId: string) => api.post(`/user/follow/${userId}`),
    unfollowUser: (userId: string) => api.post(`/user/unfollow/${userId}`),
    acceptFollowRequest: (userId: string) => api.post('/user/follow/accept', { userId }),
    removeFollower: (userId: string) => api.post('/user/follower/remove', { userId }),
    getSuggestedCricketers: (category?: string) => api.get('/user/suggested-cricketers', { params: { category } }),
    getFollowers: (userId: string) => api.get(`/user/${userId}/followers`),
    getFollowing: (userId: string) => api.get(`/user/${userId}/following`),
};
