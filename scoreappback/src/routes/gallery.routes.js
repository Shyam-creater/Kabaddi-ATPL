const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/gallery.controller');

router.get('/', galleryController.getGallery);
router.post('/', galleryController.createGalleryItem);
router.delete('/:id', galleryController.deleteGalleryItem);

module.exports = router;
