const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const ApiError = require('../utils/ApiError');

const calculateCartTotals = (cart) => {
    const subtotal = cart.items.reduce((sum, item) => {
        const price = Number(item.price || 0);
        const qty = Number(item.quantity || 0);
        return sum + price * qty;
    }, 0);

    const platformFee = subtotal > 0 ? 8 : 0;
    const shippingCharges = subtotal === 0 ? 0 : subtotal > 500 ? 0 : 40;
    const finalAmount = subtotal + platformFee + shippingCharges;

    cart.totalAmount = subtotal;
    cart.platformFee = platformFee;
    cart.shippingCharges = shippingCharges;
    cart.finalAmount = finalAmount;
};

exports.addToCart = async (req, res, next) => {
    try {
        const { productId, quantity = 1, price, variantType, variantValue, variantId } = req.body;
        if (!productId) {
            return next(new ApiError(400, 'productId is required')); 
        }

        const qty = Number(quantity);
        if (qty < 1) {
            return next(new ApiError(400, 'Quantity must be at least 1')); 
        }

        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError(404, 'Product not found'));
        }

        const itemPrice = Number(price || product.price || 0);

        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        const existingIndex = cart.items.findIndex((item) => {
            const sameProduct = item.product.toString() === productId.toString();
            const sameVariant = String(item.variantId || '') === String(variantId || '');
            return sameProduct && sameVariant;
        });

        if (existingIndex > -1) {
            cart.items[existingIndex].quantity += qty;
            cart.items[existingIndex].price = itemPrice;
            if (variantType) cart.items[existingIndex].variantType = variantType;
            if (variantValue) cart.items[existingIndex].variantValue = variantValue;
        } else {
            cart.items.push({
                product: productId,
                quantity: qty,
                price: itemPrice,
                variantType,
                variantValue,
                variantId,
            });
        }

        calculateCartTotals(cart);
        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'title price category image description',
        });

        res.status(200).json({
            success: true,
            message: 'Item added to cart',
            cart: populatedCart,
        });
    } catch (error) {
        next(error);
    }
};

exports.getCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate({
            path: 'items.product',
            select: 'title price category image description',
        });

        if (!cart) {
            return res.status(200).json({
                success: true,
                cart: {
                    items: [],
                    totalAmount: 0,
                    platformFee: 0,
                    shippingCharges: 0,
                    finalAmount: 0,
                },
            });
        }

        res.status(200).json({ success: true, cart });
    } catch (error) {
        next(error);
    }
};

exports.updateCartItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { quantity, price } = req.body;

        if (!itemId) {
            return next(new ApiError(400, 'itemId is required')); 
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return next(new ApiError(404, 'Cart not found'));
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return next(new ApiError(404, 'Cart item not found'));
        }

        if (quantity !== undefined) {
            const qty = Number(quantity);
            if (qty < 1) {
                return next(new ApiError(400, 'Quantity must be at least 1'));
            }
            item.quantity = qty;
        }

        if (price !== undefined) {
            item.price = Number(price);
        }

        calculateCartTotals(cart);
        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'title price category image description',
        });

        res.status(200).json({ success: true, cart: populatedCart });
    } catch (error) {
        next(error);
    }
};

exports.removeCartItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        if (!itemId) {
            return next(new ApiError(400, 'itemId is required')); 
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return next(new ApiError(404, 'Cart not found'));
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return next(new ApiError(404, 'Cart item not found'));
        }

        item.remove();
        calculateCartTotals(cart);
        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'title price category image description',
        });

        res.status(200).json({ success: true, cart: populatedCart });
    } catch (error) {
        next(error);
    }
};

exports.clearCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(200).json({ success: true, message: 'Cart cleared', cart: { items: [], totalAmount: 0, platformFee: 0, shippingCharges: 0, finalAmount: 0 } });
        }

        cart.items = [];
        calculateCartTotals(cart);
        await cart.save();

        res.status(200).json({ success: true, message: 'Cart cleared', cart });
    } catch (error) {
        next(error);
    }
};
