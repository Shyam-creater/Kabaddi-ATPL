import api from './api';

export const authService = {
    async login(credentials: { email: string; password: string }) {
        const response = await api.post('/auth/login', { ...credentials, loginType: 'admin' });
        return response.data.data;
    },

    async getCurrentUser() {
        const response = await api.get('/user/profile');
        return response.data.data;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};
