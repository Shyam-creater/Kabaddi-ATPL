import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const register = async (data: any) => {
    const response = await api.post('/auth/register', data);
    if (response.data.data.token) {
        await AsyncStorage.setItem('token', response.data.data.token);
    }
    return response.data;
};

const login = async (data: { email: string, password: string }) => {
    const response = await api.post('/auth/login', { ...data, loginType: 'user' });
    if (response.data.data.token) {
        await AsyncStorage.setItem('token', response.data.data.token);
    }
    return response.data;
};

const getProfile = async () => {
    // Add timestamp to bypass cache (304 Not Modified issue)
    const response = await api.get(`/user/profile?_t=${Date.now()}`);
    return response.data;
};

const updateProfile = async (data: any) => {
    const response = await api.put('/user/profile', data);
    return response.data;
    return response.data;
};

const getBlockedUsers = async () => {
    const response = await api.get('/user/blocked');
    return response.data;
};

const blockUser = async (userId: string) => {
    const response = await api.post(`/user/block/${userId}`);
    return response.data;
};

const unblockUser = async (userId: string) => {
    const response = await api.post(`/user/unblock/${userId}`);
    return response.data;
};

const changePassword = async (data: any) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
};

const deleteAccount = async () => {
    const response = await api.delete('/user/delete');
    await AsyncStorage.removeItem('token');
    return response.data;
};

export default { register, login, getProfile, updateProfile, getBlockedUsers, blockUser, unblockUser, changePassword, deleteAccount };
