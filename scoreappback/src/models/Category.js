"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.categoryModel = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const categorySchema = new _mongoose.default.Schema({
  cName: {
    type: String,
    required: true
  },
  cDescription: {
    type: String
    // required: true,
  },
  cImage: {
    type: Array,
    required: true
  },
  cStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  parentId: {
    type: _mongoose.default.Schema.Types.ObjectId,
    ref: 'category',
    default: null
  },
  subCategories: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    image: {
      type: String,
      default: null
    },
    subCategories: [{
      name: {
        type: String,
        required: true
      },
      description: {
        type: String
      },
      status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
      },
      image: {
        type: String,
        default: null
      }
    }]
  }]
}, {
  timestamps: true
});
const categoryModel = exports.categoryModel = _mongoose.default.model("category", categorySchema);