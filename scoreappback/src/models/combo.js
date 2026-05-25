"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.comboModel = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
require("./Product.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Import Product model to ensure it's registered

const comboSchema = new _mongoose.default.Schema({
  ccName: {
    type: String,
    required: true
  },
  ccDescription: {
    type: String,
    required: true
  },
  ccImage: {
    type: String,
    required: true
  },
  ccPrice: {
    type: Number,
    required: true
  },
  ccOffer: {
    type: Number,
    default: 0
  },
  ccQuantity: {
    type: Number,
    required: true
  },
  ccStatus: {
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  ccProducts: [{
    product: {
      type: _mongoose.default.Schema.Types.ObjectId,
      ref: 'products',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    variant: {
      _id: {
        type: _mongoose.default.Schema.Types.ObjectId,
        ref: 'productvariants',
        required: false
      },
      size: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true,
        enum: ['size', 'color', 'weight']
      },
      price: {
        type: Number,
        required: false
      },
      quantity: {
        type: Number,
        required: false,
        default: 1
      }
    }
  }]
}, {
  timestamps: true
});
const comboModel = exports.comboModel = _mongoose.default.model("combos", comboSchema);
var _default = exports.default = comboModel;