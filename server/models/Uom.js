const mongoose = require("mongoose");

const UomSchema = new mongoose.Schema({
 
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

module.exports = mongoose.model("Uom", UomSchema);