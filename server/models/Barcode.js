// models/Barcode.js
const mongoose = require('mongoose');

const barcodeSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    barcode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    mrp: {
        type: Number,
        required: true,
        min: 0
    },
    retailRate: {
        type: Number,
        default: 0,
        min: 0
    },
    wholesaleRate: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
barcodeSchema.index({ companyId: 1, barcode: 1 });
barcodeSchema.index({ companyId: 1, productId: 1 });
barcodeSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('Barcode', barcodeSchema);