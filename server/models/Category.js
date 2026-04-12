const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company ID is required'],
        index: true
    },
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        set: function(value) {
            // This automatically trims the value before saving
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

// Compound index for unique category name per company
CategorySchema.index({ companyId: 1, name: 1 }, { unique: true });

// ✅ NO pre-save middleware - using set option instead

module.exports = mongoose.model("Category", CategorySchema);