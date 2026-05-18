const express = require('express');
const router = express.Router();
const lookingController = require('../controllers/looking.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/create', protect, lookingController.createPost);
router.get('/my-posts', protect, lookingController.getMyAllPosts);
router.get('/all-posts', protect, lookingController.getAllPosts);
module.exports = router;
