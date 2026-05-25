const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart,
} = require('../controllers/cart.controller');

router.post('/cart/add', protect, addToCart);
router.get('/cart', protect, getCart);
router.put('/cart/item/:itemId', protect, updateCartItem);
router.delete('/cart/item/:itemId', protect, removeCartItem);
router.delete('/cart', protect, clearCart);

module.exports = router;
