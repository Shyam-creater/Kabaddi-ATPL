"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Brands = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const brandSchema = new _mongoose.default.Schema({
  logo: {
    type: String,
    required: [true, 'Brand logo is required']
  },
  name: {
    type: String,
    required: [true, 'Brand name is required']
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});
const Brands = exports.Brands = _mongoose.default.model("Brand", brandSchema);