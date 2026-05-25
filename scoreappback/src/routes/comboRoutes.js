"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _protect = require("../middlewares/auth.middleware.js");
var _comboMulter = require("../middlewares/upload.middleware.js");
var _categoryMulter = require("../middlewares/upload.middleware.js");
var _comboController = require("../controllers/comboController.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = _express.default.Router();

// Admin routes (protected)
router.post("/admin/combo/create", _protect.protect, _protect.adminOnly, _categoryMulter.uploadFiles2, _comboController.createCombo);
router.get("/admin/combo/all", _protect.protect, _protect.adminOnly, _comboController.getAllCombos);
router.get("/admin/combo/:id", _protect.protect, _protect.adminOnly, _comboController.getComboById);
router.put("/admin/combo/update", _protect.protect, _protect.adminOnly, _categoryMulter.uploadFiles2, _comboController.updateCombo);
router.delete("/admin/combo/delete", _protect.protect, _protect.adminOnly, _comboController.deleteCombo);

//public routes
router.get("/combo/all", _comboController.getAllCombos);
router.get("/combo/:id", _comboController.getComboById);
router.get("/combo/:id/products", _comboController.getProductsByCombo);
var _default = exports.default = router;