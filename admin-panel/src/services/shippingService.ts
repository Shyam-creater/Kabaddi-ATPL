import api from './api';

export interface ShippingFee {
    _id?: string;
    state: string;
    productdeliveryfee: number;
    combodeliveryfee: number;
    above500_deliveryfee: number;
    above_1kg_deliveryfee: number;
    created_at?: string;
    updatedAt?: string;
}

export const shippingService = {
    getAllFees: async () => {
        const response = await api.get('/shipping');
        return response.data.data;
    },

    addFee: async (data: ShippingFee) => {
        const response = await api.post('/shipping', data);
        return response.data.data;
    },

    updateFee: async (id: string, data: ShippingFee) => {
        const response = await api.put(`/shipping/${id}`, data);
        return response.data.data;
    },

    deleteFee: async (id: string) => {
        const response = await api.delete(`/shipping/${id}`);
        return response.data;
    }
};
