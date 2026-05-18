import api from './api';

export const createLookingPost = async (data: any) => {
    try {
        const response = await api.post('/looking/create', data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getMyLookingPosts = async () => {
    try {
        const response = await api.get('/looking/my-posts');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getAllLookingPosts = async () => {
    try {
        const response = await api.get('/looking/all-posts'); // backend endpoint
        return response.data;
    } catch (error) {
        throw error;
    }
};
