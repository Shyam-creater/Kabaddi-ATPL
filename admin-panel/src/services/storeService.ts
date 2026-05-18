import api from './api';

export interface Product {
    _id: string;
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
    createdAt?: string;
}

// Get all products
export const getProducts = async (): Promise<Product[]> => {
    const res = await api.get('/products');
    return res.data;
};

// Create product
export const createProduct = async (data: Partial<Product>) => {
    return api.post('/products', data);
};

// Update product
export const updateProduct = async (id: string, data: Partial<Product>) => {
    return api.put(`/products/${id}`, data);
};

// Delete product
export const deleteProduct = async (id: string) => {
    return api.delete(`/products/${id}`);
};
