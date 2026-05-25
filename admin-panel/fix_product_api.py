import re

file_path = "src/services/productApi.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the broken block
start_marker = "formData.append('pMetaTitle', productData.pMetaTitle || '');"
end_marker = "timeout: 120000, // 2 minutes timeout"

if start_marker in content and end_marker in content:
    start_idx = content.index(start_marker)
    end_idx = content.index(end_marker)
    
    replacement = """formData.append('pMetaTitle', productData.pMetaTitle || '');
      formData.append('pMetaKeywords', productData.pMetaKeywords || '');
      formData.append('pMetaDescription', productData.pMetaDescription || '');
      formData.append('pCanonicalUrl', productData.pCanonicalUrl || '');
      formData.append('pUrl', productData.pUrl || '');
      formData.append('schemaMarkup', productData.schemaMarkup || '');

      // Handle image upload
      if (Array.isArray(productData.images)) {
        const validImages = productData.images.filter(image => image);
        
        if (validImages.length === 0) {
          throw new Error('Please upload at least one image.');
        }
  
        validImages.forEach((image) => {
          if (typeof image === 'string' && image.startsWith('data:image')) {
            const imageFile = dataURLtoFile(image, `product-image-${Date.now()}.jpg`);
            formData.append('images', imageFile);
          } else if (image instanceof File) {
            formData.append('images', image);
          }
        });
      }
  
      // Log formData contents for debugging
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]));
      }

      const response = await axiosInstance.post('/admin/product/new', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        """
        
    content = content[:start_idx] + replacement + content[end_idx:]
    
    # Also replace pImage to images in updateProduct
    content = content.replace("formData.append('pImage', imageFile);", "formData.append('images', imageFile);")
    content = content.replace("formData.append('pImage', image);", "formData.append('images', image);")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed productApi.js")
else:
    print("Markers not found")
