const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  tamilName: String,
  mrp: Number,
  retailRate: Number,
  wholesaleRate: Number,

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand"
  },
  uom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Uom"
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);