const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required'],
    index: true
  },
  productCode: {
    type: String,
    required: [true, 'Product code is required'],
    trim: true,
    // ✅ Remove 'unique: true' from here - we'll use compound index instead
    set: function(value) {
      // Automatically trim the value before saving
      return value ? value.trim() : value;
    }
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    set: function(value) {
      return value ? value.trim() : value;
    }
  },
  tamilName: {
    type: String,
    trim: true,
    set: function(value) {
      return value ? value.trim() : value;
    }
  },
  mrp: {
    type: Number,
    min: [0, 'MRP cannot be negative']
  },
  retailRate: {
    type: Number,
    min: [0, 'Retail rate cannot be negative']
  },
  wholesaleRate: {
    type: Number,
    min: [0, 'Wholesale rate cannot be negative']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    index: true
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    index: true
  },
  uom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Uom",
    required: [true, 'Unit of measurement is required'],
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// ✅ Compound unique index for product code per company (same pattern as Category)
// This allows different companies to have the same product code,
// but prevents duplicates within the same company
ProductSchema.index({ companyId: 1, productCode: 1 }, { unique: true });
// ✅ Add compound unique index for name per company
ProductSchema.index({ companyId: 1, name: 1 }, { unique: true });

// Additional indexes for better query performance
ProductSchema.index({ companyId: 1, isActive: 1 });
ProductSchema.index({ companyId: 1, category: 1 });
ProductSchema.index({ companyId: 1, brand: 1 });
ProductSchema.index({ name: 1 }); // For text search

module.exports = mongoose.model("Product", ProductSchema);