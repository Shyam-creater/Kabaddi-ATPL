const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    title: {
        type: String, // Optional caption
        default: ''
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'General'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
