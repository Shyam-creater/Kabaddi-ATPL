const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const ApiError = require('../utils/ApiError');

const calculateTotals = (items) => {
    const totalAmount = items.reduce((sum, item) => {
        const price = Number(item.price || 0);
        const qty = Number(item.quantity || 0);
        return sum + price * qty;
    }, 0);
    const platformFee = totalAmount > 0 ? 8 : 0;
    const shippingCharges = totalAmount === 0 ? 0 : totalAmount > 500 ? 0 : 40;
    const finalAmount = totalAmount + platformFee + shippingCharges;

    return { totalAmount, platformFee, shippingCharges, finalAmount };
};

exports.createOrder = async (req, res, next) => {
    try {
        const { items: requestedItems, shippingAddress, paymentMethod = 'COD', orderNotes } = req.body;
        const userId = req.user._id;

        let orderItems = [];
        let totals;

        if (Array.isArray(requestedItems) && requestedItems.length > 0) {
            const loadedItems = await Promise.all(requestedItems.map(async (item) => {
                const product = await Product.findById(item.productId);
                if (!product) {
                    throw new ApiError(404, `Product not found: ${item.productId}`);
                }
                return {
                    product: product._id,
                    quantity: Number(item.quantity || 1),
                    price: Number(item.price || product.price || 0),
                    variantType: item.variantType,
                    variantValue: item.variantValue,
                    variantId: item.variantId,
                };
            }));
            orderItems = loadedItems;
            totals = calculateTotals(orderItems);
        } else {
            const cart = await Cart.findOne({ user: userId }).populate('items.product');
            if (!cart || cart.items.length === 0) {
                return next(new ApiError(400, 'Cart is empty')); 
            }
            orderItems = cart.items.map((item) => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.price,
                variantType: item.variantType,
                variantValue: item.variantValue,
                variantId: item.variantId,
            }));
            totals = calculateTotals(orderItems);
            await Cart.findOneAndDelete({ user: userId });
        }

        const order = await Order.create({
            user: userId,
            items: orderItems,
            shippingAddress: shippingAddress || {},
            paymentMethod,
            orderNotes,
            ...totals,
            paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        });

        res.status(201).json({ success: true, order });
    } catch (error) {
        next(error);
    }
};

exports.getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate({
            path: 'items.product',
            select: 'title price category image description',
        });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        next(error);
    }
};

exports.getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate({
            path: 'items.product',
            select: 'title price category image description',
        });
        if (!order) {
            return next(new ApiError(404, 'Order not found'));
        }
        res.status(200).json({ success: true, order });
    } catch (error) {
        next(error);
    }
};

exports.getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).populate({
            path: 'items.product',
            select: 'title price category image description',
        });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        next(error);
    }
};

exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            return next(new ApiError(400, 'Order status is required')); 
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return next(new ApiError(404, 'Order not found'));
        }

        order.orderStatus = status;
        await order.save();

        res.status(200).json({ success: true, order });
    } catch (error) {
        next(error);
    }
};
