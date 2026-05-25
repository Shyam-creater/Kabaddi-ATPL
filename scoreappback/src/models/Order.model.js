const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    default: 1,
                },
                price: {
                    type: Number,
                    required: true,
                    default: 0,
                },
                variantType: String,
                variantValue: String,
                variantId: String,
            },
        ],
        shippingAddress: {
            name: String,
            phone: String,
            address: String,
            city: String,
            state: String,
            pincode: String,
            country: {
                type: String,
                default: 'India',
            },
        },
        paymentMethod: {
            type: String,
            enum: ['COD', 'ONLINE'],
            default: 'ONLINE',
        },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'PAID', 'FAILED'],
            default: 'PENDING',
        },
        orderStatus: {
            type: String,
            enum: ['ORDER_PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
            default: 'ORDER_PLACED',
        },
        totalAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        platformFee: {
            type: Number,
            required: true,
            default: 0,
        },
        shippingCharges: {
            type: Number,
            required: true,
            default: 0,
        },
        finalAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        orderNotes: String,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Order', orderSchema);
