import api from './api';

export const adminService = {
    async getDashboardStats() {
        const response = await api.get('/admin/dashboard');
        return response.data.data;
    },

    async getAllUsers() {
        const response = await api.get('/admin/users?includeAdmins=true');
        return response.data.data;
    },

    async updateUserRole(userId: string, role: string) {
        const response = await api.put(`/admin/users/${userId}/role`, { role });
        return response.data.data;
    },

    async updateUserStatus(userId: string, status: string) {
        const response = await api.put(`/admin/users/${userId}/status`, { status });
        return response.data.data;
    },

    async deleteUser(userId: string) {
        const response = await api.delete(`/admin/users/${userId}`);
        return response.data;
    },

    async getPlayerDetailedStats(userId: string) {
        const response = await api.get(`/admin/players/${userId}/stats`);
        return response.data.data;
    }
};
