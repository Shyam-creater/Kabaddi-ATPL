"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _protect = require("../middlewares/auth.middleware.js");
var _categoryMulter = require("../middlewares/upload.middleware.js");
var _subcategoryMulter = require("../middlewares/upload.middleware.js");
var _categoryControll = require("../controllers/categoryControll.js");
var _upload = _interopRequireDefault(require("../middlewares/upload.middleware.js"));
var _isVendorAuth = require("../middlewares/vendor.middleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// Admin routes (protected)
router.post("/admin/category/new", _protect.protect, _protect.adminOnly, _categoryMulter.uploadImage, _categoryControll.createCategory);
router.put("/admin/category/:id", _protect.protect, _protect.adminOnly, _categoryMulter.uploadImage, _categoryControll.updateCategory);
router.delete("/admin/category/:id", _protect.protect, _protect.adminOnly, _categoryControll.deleteCategory);

// Public routes
router.get("/category/all", _categoryControll.getAllCategory);
router.get("/category/:id", _categoryControll.getCategoryById);
router.post('/upload-image', _subcategoryMulter.uploadImage);

// Subcategory routes
router.get('/category/:categoryId/subcategories', _categoryControll.getSubCategories);
router.post('/admin/category/:categoryId/subcategories', _protect.protect, _protect.adminOnly, _subcategoryMulter.uploadSubcategoryImage, _categoryControll.createSubCategory);
router.put('/admin/category/:categoryId/subcategories/:subCategoryId', _protect.protect, _protect.adminOnly, _subcategoryMulter.uploadSubcategoryImage, _categoryControll.updateSubCategory);
router.delete('/admin/category/:categoryId/subcategories/:subCategoryId', _protect.protect, _protect.adminOnly, _categoryControll.deleteSubCategory);

// Add this route
router.get('/category/:categoryName/products', _categoryControll.getProductsByCategory);

// Nested subcategory routes - Admin
router.get('/admin/category/:categoryId/subcategories/:subCategoryId/nested', _protect.protect, _protect.adminOnly, _categoryControll.getNestedSubCategories);
router.post('/admin/category/:categoryId/subcategories/:parentSubCategoryId/nested', _protect.protect, _protect.adminOnly, _subcategoryMulter.uploadSubcategoryImage, _categoryControll.createNestedSubCategory);
router.delete('/admin/category/:categoryId/subcategories/:parentSubCategoryId/nested/:nestedSubCategoryId', _protect.protect, _protect.adminOnly, _categoryControll.deleteNestedSubCategory);
router.put('/admin/category/:categoryId/subcategories/:parentSubCategoryId/nested/:nestedSubCategoryId', _protect.protect, _protect.adminOnly, _subcategoryMulter.uploadSubcategoryImage, _categoryControll.updateNestedSubCategory);

// Nested subcategory routes - Shop
router.get('/category/:categoryId/subcategories/:subCategoryId/nested', _categoryControll.getNestedSubCategories);
router.post('/category/:categoryId/subcategories/:parentSubCategoryId/nested', _subcategoryMulter.uploadSubcategoryImage, _categoryControll.createNestedSubCategory);
router.delete('/category/:categoryId/subcategories/:parentSubCategoryId/nested/:nestedSubCategoryId', _categoryControll.deleteNestedSubCategory);
router.put('/category/:categoryId/subcategories/:parentSubCategoryId/nested/:nestedSubCategoryId', _subcategoryMulter.uploadSubcategoryImage, _categoryControll.updateNestedSubCategory);

// Vendor routes
router.get("/category/:id", _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _categoryControll.getCategoryById);
router.get("/category/all", _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _categoryControll.getAllCategory);
router.get("/category/:id/subcategories", _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _categoryControll.getSubCategories);
router.get("/category/:categoryId/subcategories/:subCategoryId/nested", _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _categoryControll.getNestedSubCategories);
router.get("/category/:categoryName/products", _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _categoryControll.getProductsByCategory);
var _default = exports.default = router;