"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _ProductVariant = require("../controllers/productVariant.controller.js");
var _isVendorAuth = require("../middlewares/vendor.middleware.js");
var _protect = require("../middlewares/auth.middleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// Admin routes (protected)
router.post('/create', _protect.protect, _protect.adminOnly, _ProductVariant.createProductVariants);
router.put('/update/:variantId', _protect.protect, _protect.adminOnly, _ProductVariant.updateProductVariant);
router.delete('/delete/:variantId', _protect.protect, _protect.adminOnly, _ProductVariant.deleteProductVariant);

// Vendor routes (protected)
router.post('/vendor/create', _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _ProductVariant.createProductVariants);
router.put('/vendor/update/:variantId', _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _ProductVariant.updateProductVariant);
router.delete('/vendor/delete/:variantId', _isVendorAuth.isVendorAuth, _isVendorAuth.isVerifiedVendor, _ProductVariant.deleteProductVariant);

// Public routes (accessible to all users)
router.get('/product/:productId', _ProductVariant.getProductVariants);
router.get('/:variantId', _ProductVariant.getVariantById);
var _default = exports.default = router;