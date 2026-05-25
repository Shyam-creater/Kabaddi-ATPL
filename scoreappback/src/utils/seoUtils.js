exports.getProductCanonicalUrl = (product) => {
    return `/product/${product._id}`;
};

exports.generateProductStructuredData = (product) => {
    return JSON.stringify({
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.pName,
        "image": product.pImage,
        "description": product.pDescription
    });
};
