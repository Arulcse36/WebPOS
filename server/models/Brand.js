const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company ID is required'],
        index: true
    },
    name: {
        type: String,
        required: [true, 'Brand name is required'],
        trim: true,
        set: function(value) {
            return value ? value.trim() : value;
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique brand name per company
BrandSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Brand", BrandSchema);