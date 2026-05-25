"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _protect = require("../middlewares/auth.middleware.js");
var _multer = require("../middlewares/upload.middleware.js");
var _Products = require("../controllers/product.controller.js");
var _categoryControll = require("../controllers/categoryControll.js");
var _protect = require("../middlewares/auth.middleware.js");
var _isVendorAuth = require("../middlewares/vendor.middleware.js");
var _Product = _interopRequireDefault(require("../models/Product.model.js"));
var _Category = require("../models/Category.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// Admin routes (protected)
router.post("/admin/product/new", _protect.protect, _protect.adminOnly, _multer.uploadFiles, _Products.createProduct);
router.get("/admin/product/all", _protect.protect, _protect.adminOnly, _Products.getAllProducts);
router.get("/admin/product/", _protect.protect, _protect.adminOnly, _Products.getProductById);
router.put("/admin/product/:id", _protect.protect, _protect.adminOnly, _multer.uploadFiles, _Products.updateProduct);
router.delete("/admin/product/:id", _protect.protect, _protect.adminOnly, _Products.deleteProduct);
router.delete("/admin/product/image/:productId", _protect.protect, _protect.adminOnly, _Products.deleteProductImage);

// Vendor routes (protected)
router.post("/vendor/product/new", _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _multer.uploadFiles, _Products.createProduct);
router.put("/vendor/product/:id", _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _multer.uploadFiles, _Products.updateProduct);
router.delete("/vendor/product/:id", _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _Products.deleteProduct);
router.get("/vendor/product/all", _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _Products.getAllProducts);
router.get("/vendor/product/vendorId", _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _Products.getProductsByVendorId);

// Public routes (no authentication required)
router.get("/", _Products.getAllProducts); // Get all products
router.get("/products", _Products.getAllProducts); // Alias: also serve products at /products
router.post("/filterproducts", _Products.fiterProducts); // Get all products
router.get("/product/:id", _Products.getProductById); // Get single product by ID
router.get("/producttype/combo", _Products.getProductByType); // Get single product by ID
router.get("/product/category/:category", _categoryControll.getProductsByCategory); // Get products by category
router.post('/product/:productId/reviews', _protect.protect, _multer.uploadFiles, _Products.addRatingAndReview);
router.get('/product/:productId/reviews', _Products.getProductReviews);
router.get('/product/:productId/canreview', _protect.protect, _Products.getAuthReviews);
router.delete('/product/:productId/reviews/:reviewId', _protect.protect, _Products.deleteReview);
router.get("/products/subcategories/with-more-than-10", _Products.getSubcategoryWithMoreThan10Products);
router.get("/products/offer", _Products.getAllProductByOffer);
router.get("/products/nested-subcategories/with-more-than-10", _Products.getNestedSubCategoryWithMoreThan10Products);
router.get("/products/:productId/related", _Products.getRelatedProducts);
router.get("/products/latest", _Products.getLatestProduct);
router.post("/products/brand", _Products.getbrandProduct);
router.get("/products/group", _Products.getProductsGroupedByName);

//brand routes  
router.get("/product/brand/:brand", _Products.getProductsByBrand);

// Add route for subcategory products
router.get("/products/subcategory/:subCategoryId", async (req, res) => {
  try {
    const {
      subCategoryId
    } = req.params;

    // First get the subcategory name
    const category = await _Category.categoryModel.findOne({
      'subCategories._id': subCategoryId
    });
    if (!category) {
      return res.json({
        success: true,
        products: [],
        message: 'Category not found'
      });
    }

    // Find the subcategory name
    let subCategoryName = '';
    category.subCategories.forEach(sub => {
      if (sub._id.toString() === subCategoryId) {
        subCategoryName = sub.name;
      }
    });
    if (!subCategoryName) {
      return res.json({
        success: true,
        products: [],
        message: 'Subcategory not found'
      });
    }

    // Find products using the name
    const products = await _Product.default.find({
      pSubCategory: subCategoryName,
      pStatus: {
        $regex: new RegExp("^(active|Out of Stock)$", "i")
      }
    });

    // Transform product images
    const transformedProducts = products.map(product => ({
      ...product.toObject(),
      pImage: product.pImage.map(img => `${img}`)
    }));
    res.json({
      success: true,
      products: transformedProducts,
      debug: {
        subCategoryId: subCategoryId,
        subCategoryName: subCategoryName,
        matchingProducts: products.length
      }
    });
  } catch (error) {
    console.error('Backend Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.stack
    });
  }
});

// Add this new route for nested subcategory products
router.get("/products/nested-subcategory/:nestedSubCategory", async (req, res) => {
  try {
    const {
      nestedSubCategory
    } = req.params;

    // First get the nested subcategory name and parent subcategory name
    const category = await _Category.categoryModel.findOne({
      'subCategories.subCategories._id': nestedSubCategory
    });
    if (!category) {
      return res.json({
        success: true,
        products: [],
        message: 'Category not found'
      });
    }

    // Find the nested subcategory name and parent subcategory name
    let nestedSubCategoryName = '';
    let parentSubCategoryName = '';
    category.subCategories.forEach(sub => {
      sub.subCategories.forEach(nested => {
        if (nested._id.toString() === nestedSubCategory) {
          nestedSubCategoryName = nested.name;
          parentSubCategoryName = sub.name;
        }
      });
    });

    // Find products that either:
    // 1. Have the nested subcategory name, OR
    // 2. Don't have a nested subcategory name (empty/null) but belong to the parent subcategory
    const products = await _Product.default.find({
      pStatus: {
        $regex: new RegExp("^(active|Out of Stock)$", "i")
      },
      $or: [{
        pNestedSubCategory: nestedSubCategoryName
      }, {
        $and: [{
          pSubCategory: parentSubCategoryName
        }, {
          $or: [{
            pNestedSubCategory: {
              $exists: false
            }
          }, {
            pNestedSubCategory: null
          }, {
            pNestedSubCategory: ''
          }, {
            pNestedSubCategory: {
              $regex: /^\s*$/,
              $options: 'i'
            }
          }]
        }]
      }]
    });

    // console.log('Query results:', {
    //   searchedName: nestedSubCategoryName,
    //   matchingProducts: products.length,
    //   matchingProductDetails: products.map(p => ({
    //     id: p._id,
    //     name: p.pName,
    //     nestedSubCategory: p.pNestedSubCategory
    //   }))
    // });

    // Transform product images
    const transformedProducts = products.map(product => ({
      ...product.toObject(),
      pImage: product.pImage.map(img => `${img}`)
    }));
    res.json({
      success: true,
      products: transformedProducts,
      debug: {
        nestedSubCategoryId: nestedSubCategory,
        nestedSubCategoryName: nestedSubCategoryName,
        matchingProducts: products.length
      }
    });
  } catch (error) {
    console.error('Backend Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.stack
    });
  }
});
router.get("/products/nested-subbrand/:nestedSubCategory/:brand", async (req, res) => {
  try {
    const {
      nestedSubCategory,
      brand
    } = req.params;

    // First get the nested subcategory name and parent subcategory name
    const category = await _Category.categoryModel.findOne({
      'subCategories.subCategories._id': nestedSubCategory
    });
    if (!category) {
      return res.json({
        success: true,
        products: [],
        message: 'Category not found'
      });
    }

    // Find the nested subcategory name and parent subcategory name
    let nestedSubCategoryName = '';
    let parentSubCategoryName = '';
    category.subCategories.forEach(sub => {
      sub.subCategories.forEach(nested => {
        if (nested._id.toString() === nestedSubCategory) {
          nestedSubCategoryName = nested.name;
          parentSubCategoryName = sub.name;
        }
      });
    });

    // Find products that either:
    // 1. Have the nested subcategory name, OR
    // 2. Don't have a nested subcategory name (empty/null) but belong to the parent subcategory
    // And match the brand
    const products = await _Product.default.find({
      pBrand: {
        $regex: brand,
        $options: 'i'
      },
      pStatus: {
        $regex: new RegExp("^(active|Out of Stock)$", "i")
      },
      $or: [{
        pNestedSubCategory: nestedSubCategoryName
      }, {
        $and: [{
          pSubCategory: parentSubCategoryName
        }, {
          $or: [{
            pNestedSubCategory: {
              $exists: false
            }
          }, {
            pNestedSubCategory: null
          }, {
            pNestedSubCategory: ''
          }, {
            pNestedSubCategory: {
              $regex: /^\s*$/,
              $options: 'i'
            }
          }]
        }]
      }]
    });

    // Transform product images
    const transformedProducts = products.map(product => ({
      ...product.toObject(),
      pImage: product.pImage.map(img => `${img}`)
    }));
    res.json({
      success: true,
      products: transformedProducts,
      debug: {
        nestedSubCategoryId: nestedSubCategory,
        nestedSubCategoryName: nestedSubCategoryName,
        matchingProducts: products.length
      }
    });
  } catch (error) {
    console.error('Backend Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.stack
    });
  }
});
var _default = exports.default = router;