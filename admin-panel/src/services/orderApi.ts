import api from './api';

export const orderApi = {
    getAllOrders: async () => {
        try {
            const response = await api.get('/orders/admin/all');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch orders');
        }
    },

    getOrderById: async (id: string) => {
        try {
            const response = await api.get(`/orders/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch order');
        }
    },

    updateOrderStatus: async (id: string, status: string) => {
        try {
            const response = await api.patch(`/orders/${id}/status`, { status });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update order status');
        }
    }
};
