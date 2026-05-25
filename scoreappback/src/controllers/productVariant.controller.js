"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateProductVariant = exports.getVariantById = exports.getProductVariants = exports.deleteProductVariant = exports.createProductVariants = void 0;
var _ProductVariant = _interopRequireDefault(require("../models/ProductVariant.model.js"));
var _Product = _interopRequireDefault(require("../models/Product.model.js"));
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const createProductVariants = async (req, res) => {
  try {
    if (!req.user || !["admin", "super_admin", "vendor"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized Access"
      });
    }
    const variantsArray = Array.isArray(req.body) ? req.body : [req.body];
    if (!variantsArray.length) {
      return res.status(400).json({
        success: false,
        message: "At least one variant is required"
      });
    }
    const {
      productId
    } = variantsArray[0];
    if (!_mongoose.default.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }
    const product = await _Product.default.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    const createdVariants = [];
    for (const variant of variantsArray) {
      const {
        attributes,
        price,
        stock
      } = variant;

      // ✅ Validate attributes
      if (!attributes || !attributes.size && !attributes.color && !attributes.weight && !attributes.shoe && !attributes.belt) {
        return res.status(400).json({
          success: false,
          message: "At least one attribute (size / color / weight / shoe / belt) is required"
        });
      }
      if (price <= 0 || stock < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid price or stock"
        });
      }

      // ✅ Duplicate check (combination based)
      const duplicate = await _ProductVariant.default.findOne({
        productId,
        "attributes.size": attributes.size || null,
        "attributes.color": attributes.color || null,
        "attributes.weight": attributes.weight || null,
        "attributes.shoe": attributes.shoe || null,
        "attributes.belt": attributes.belt || null
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Variant combination already exists"
        });
      }
      const newVariant = await _ProductVariant.default.create({
        productId,
        attributes,
        price,
        stock,
        previousPrice: variant.previousPrice || 0,
        offer: variant.offer || 0,
        min: variant.min || 1,
        status: variant.status || "active",
        isDefault: variant.isDefault || false,
        pvCanonicalUrl: variant.pvCanonicalUrl || [product.pCanonicalUrl, attributes.size, attributes.color, attributes.weight, attributes.shoe, attributes.belt].filter(Boolean).join("-")
      });
      createdVariants.push(newVariant);
    }
    product.variants.push(...createdVariants.map(v => v._id));
    await product.save();
    return res.status(201).json({
      success: true,
      message: "Product variants created successfully",
      count: createdVariants.length,
      variants: createdVariants
    });
  } catch (error) {
    console.error("Create Variant Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating variants"
    });
  }
};

// Get all variants for a product
exports.createProductVariants = createProductVariants;
const getProductVariants = async (req, res) => {
  try {
    const {
      productId
    } = req.params;
    if (!_mongoose.default.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }
    const product = await _Product.default.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    const variants = await _ProductVariant.default.find({
      productId,
      status: "active"
    });
    const groupedProducts = await _Product.default.aggregate([{
      $match: {
        pName: product.pName
      }
    }, {
      $group: {
        _id: "$pName",
        productIds: {
          $push: "$_id"
        },
        variantIds: {
          $push: "$variants"
        },
        products: {
          $push: "$$ROOT"
        },
        totalProducts: {
          $sum: 1
        }
      }
    }, {
      $addFields: {
        variantIds: {
          $reduce: {
            input: "$variantIds",
            initialValue: [],
            in: {
              $concatArrays: ["$$value", "$$this"]
            }
          }
        }
      }
    }, {
      $lookup: {
        from: "productvariants",
        localField: "variantIds",
        foreignField: "_id",
        as: "variants"
      }
    }, {
      $project: {
        _id: 0,
        pName: "$_id",
        totalProducts: 1,
        product: {
          pImage: "$products.pImage"
        },
        productIds: 1,
        productImages: "$products.pImage",
        variants: 1
      }
    }, {
      $addFields: {
        color: {
          $map: {
            input: {
              $objectToArray: {
                $arrayToObject: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$variants",
                        as: "v",
                        cond: {
                          $and: [{
                            $ne: ["$$v.attributes.color", null]
                          }, {
                            $ne: ["$$v.attributes.color", ""]
                          }, {
                            $ne: ["$$v.attributes.hex", null]
                          }]
                        }
                      }
                    },
                    as: "v",
                    in: {
                      k: {
                        $toLower: "$$v.attributes.color"
                      },
                      v: {
                        productId: "$$v.productId",
                        hex: {
                          $ifNull: ["$$v.attributes.hex", "#000000"]
                        }
                      }
                    }
                  }
                }
              }
            },
            as: "c",
            in: {
              color: "$$c.k",
              productId: "$$c.v.productId",
              hex: "$$c.v.hex"
            }
          }
        }
      }
    }]);
    return res.status(200).json({
      success: true,
      product: {
        id: product._id,
        name: product.pName,
        category: product.pCategory,
        brand: product.pBrand
      },
      count: variants.length,
      variants,
      groupedProducts
    });
  } catch (error) {
    console.error("Error in getProductVariants:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching product variants"
    });
  }
};

// Get a single variant by ID
exports.getProductVariants = getProductVariants;
const getVariantById = async (req, res) => {
  try {
    const {
      variantId
    } = req.params;
    if (!_mongoose.default.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid variant ID"
      });
    }
    const variant = await _ProductVariant.default.findById(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found"
      });
    }
    const product = await _Product.default.findById(variant.productId);
    return res.status(200).json({
      success: true,
      variant,
      product: {
        name: product?.pName,
        category: product?.pCategory,
        brand: product?.pBrand
      }
    });
  } catch (error) {
    console.error("Error in getVariantById:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching variant"
    });
  }
};

// Update a product variant
exports.getVariantById = getVariantById;
const updateProductVariant = async (req, res) => {
  try {
    if (!req.user || !["admin", "super_admin", "vendor"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }
    const {
      variantId
    } = req.params;
    const updates = req.body;
    if (!_mongoose.default.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid variant ID"
      });
    }
    if (updates.price !== undefined && updates.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price"
      });
    }
    if (updates.stock !== undefined && updates.stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock"
      });
    }
    const updatedVariant = await _ProductVariant.default.findByIdAndUpdate(variantId, updates, {
      new: true
    });
    if (!updatedVariant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Variant updated successfully",
      variant: updatedVariant
    });
  } catch (error) {
    console.error("Error in updateProductVariant:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating variant"
    });
  }
};

// Delete a product variant
exports.updateProductVariant = updateProductVariant;
const deleteProductVariant = async (req, res) => {
  try {
    if (!req.user || !["admin", "super_admin", "vendor"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }
    const {
      variantId
    } = req.params;
    if (!_mongoose.default.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid variant ID"
      });
    }
    const variant = await _ProductVariant.default.findById(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found"
      });
    }
    await _ProductVariant.default.findByIdAndDelete(variantId);
    await _Product.default.findByIdAndUpdate(variant.productId, {
      $pull: {
        variants: variantId
      }
    });
    return res.status(200).json({
      success: true,
      message: "Variant deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteProductVariant:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting variant"
    });
  }
};
exports.deleteProductVariant = deleteProductVariant;