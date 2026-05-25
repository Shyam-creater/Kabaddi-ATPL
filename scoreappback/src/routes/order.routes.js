const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
} = require('../controllers/order.controller');

router.post('/', protect, createOrder);
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
