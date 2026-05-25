"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateBrand = exports.getBrandById = exports.getAllBrands = exports.deleteBrand = exports.createBrand = void 0;
var _Brand = require("../models/Brand.js");
var _brandMulter = require("../middlewares/upload.middleware.js");
var _path = require("path");
// Create a new brand
const createBrand = async (req, res) => {
  try {
    const {
      name,
      description
    } = req.body;
    const existingBrand = await _Brand.Brands.findOne({
      name
    });
    if (existingBrand) {
      return res.status(400).json({
        message: "Brand already exists"
      });
    }
    let logoUrl = null;
    if (req.file) {
      logoUrl = _path.basename(req.file.path);
    }
    const brand = new _Brand.Brands({
      name,
      description,
      logo: logoUrl
    });
    await brand.save();
    res.status(201).json({
      message: "Brand created successfully",
      brand
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating brand",
      error: error.message
    });
  }
};

// Get all brands
exports.createBrand = createBrand;
const getAllBrands = async (req, res) => {
  try {
    const brands = await _Brand.Brands.find();
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching brands',
      error: error.message
    });
  }
};

// Get single brand by ID
exports.getAllBrands = getAllBrands;
const getBrandById = async (req, res) => {
  try {
    const brand = await _Brand.Brands.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({
        message: 'Brand not found'
      });
    }
    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching brand',
      error: error.message
    });
  }
};

// Update brand
exports.getBrandById = getBrandById;
const updateBrand = async (req, res) => {
  try {
    const {
      name,
      description
    } = req.body;
    console.log("Updating brand ID:", req.params.id, "with name:", name);
    const brand = await _Brand.Brands.findById(req.params.id);
    if (!brand) {
      console.log("Brand not found for ID:", req.params.id);
      return res.status(404).json({
        message: "Brand not found"
      });
    }
    if (name && name !== brand.name) {
      const existingBrand = await _Brand.Brands.findOne({
        name
      });
      if (existingBrand) {
        return res.status(400).json({
          message: "Brand name already exists"
        });
      }
    }
    if (name) brand.name = name;
    if (description !== undefined) brand.description = description;
    if (req.file) {
      console.log("New logo file detected, uploading to Cloudinary...");
      const logoUrl = _path.basename(req.file.path);
      brand.logo = logoUrl;
    }
    await brand.save();
    console.log("Brand updated successfully");
    res.status(200).json({
      message: "Brand updated successfully",
      brand
    });
  } catch (error) {
    console.error("CRITICAL ERROR IN UPDATEBRAND:", error);
    res.status(500).json({
      message: "Error updating brand",
      error: error.message,
      stack: error.stack,
      details: error
    });
  }
};

// Delete brand
exports.updateBrand = updateBrand;
const deleteBrand = async (req, res) => {
  try {
    const brand = await _Brand.Brands.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({
        message: 'Brand not found'
      });
    }
    await _Brand.Brands.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting brand',
      error: error.message
    });
  }
};
exports.deleteBrand = deleteBrand;