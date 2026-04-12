const mongoose = require("mongoose");

const UomSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company ID is required'],
        index: true
    },
    name: {
        type: String,
        required: [true, 'UOM name is required'],
        trim: true,
        set: function(value) {
            return value ? value.trim() : value;
        }
        // ✅ REMOVED unique: true - will use compound index instead
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// ✅ Compound index to ensure unique UOM name per company
UomSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Uom", UomSchema);