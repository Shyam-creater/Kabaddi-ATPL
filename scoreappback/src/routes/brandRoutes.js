"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _BrandCC = require("../controllers/BrandCC.js");
var _protect = require("../middlewares/auth.middleware.js");
var _brandMulter = require("../middlewares/upload.middleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// Admin-only routes
router.post('/create', _protect.protect, _brandMulter.upload.single("logo"), _BrandCC.createBrand);
router.put('/update/:id', _protect.protect, _brandMulter.upload.single("logo"), _BrandCC.updateBrand);
router.delete('/delete/:id', _protect.protect, _protect.adminOnly, _BrandCC.deleteBrand);

// Public routes (can be accessed by anyone)
router.get('/all', _BrandCC.getAllBrands);
router.get('/:id', _BrandCC.getBrandById);
var _default = exports.default = router;