import axiosInstance from "./api";

const transformImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:image')) {
    return imagePath;
  }
  const filename = imagePath.split('\\').pop().split('/').pop();
  const serverUrl = (axiosInstance.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${serverUrl}/public/uploads/${filename}`;
};
export const brandApi = {
  // Create a new brand
  createBrand: async (data) => {
    try {
      // Use FormData since we're sending a file (logo)
      const response = await axiosInstance.post('/brand/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all brands
  getAllBrands: async () => {
    try {
      const response = await axiosInstance.get('/brand/all');
      let brands = response.data.brands || response.data;
      if (Array.isArray(brands)) {
        brands = brands.map(brand => ({
          ...brand,
          logo: transformImageUrl(brand.logo)
        }));
      }
      return brands;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update a brand
  updateBrand: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/brand/update/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a brand
  deleteBrand: async (id) => {
    try {
      const response = await axiosInstance.delete(`/brand/delete/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
