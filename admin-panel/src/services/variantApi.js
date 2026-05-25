import axiosInstance from "./api";

export const variantApi = {
  // Create product variants
  // Accepts meta fields: pvMetaTitle, pvMetaKeywords, pvMetaDescription, pvCanonicalUrl for each variant object
  createProductVariants: async (variants) => {
    try {
      const response = await axiosInstance.post('/variants/create', variants);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all variants for a product
  getProductVariants: async (productId) => {
    try {
      const response = await axiosInstance.get(`/variants/product/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get a single variant by ID
  getVariantById: async (variantId) => {
    try {
      const response = await axiosInstance.get(`/variants/${variantId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update a product variant
  // Accepts meta fields: pvMetaTitle, pvMetaKeywords, pvMetaDescription, pvCanonicalUrl in `data`
  updateProductVariant: async (variantId, data) => {
    try {
      const response = await axiosInstance.put(`/variants/update/${variantId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a product variant
  deleteProductVariant: async (variantId) => {
    try {
      const response = await axiosInstance.delete(`/variants/delete/${variantId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}; 