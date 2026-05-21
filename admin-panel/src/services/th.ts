import api from './api';

export const thService = {
    async getDashboardStats() {
        const response = await api.get('/th/dashboard');
        return response.data.data;
    },

    async getMyLeagues() {
        const response = await api.get('/th/leagues');
        return response.data.data;
    },

    async getScorers() {
        const response = await api.get('/th/scorers');
        return response.data.data;
    },

    async createScorer(payload: { name: string; email: string; phone?: string; password: string }) {
        const response = await api.post('/th/scorers', payload);
        return response.data.data;
    },

    async updateScorerStatus(id: string, status: 'active' | 'pending' | 'suspended') {
        const response = await api.put(`/th/scorers/${id}/status`, { status });
        return response.data.data;
    },

    async deleteScorer(id: string) {
        const response = await api.delete(`/th/scorers/${id}`);
        return response.data.data;
    }
};
