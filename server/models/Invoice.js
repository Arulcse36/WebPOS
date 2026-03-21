const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      qty: Number,
      price: Number,
      total: Number
    }
  ],
  totalAmount: Number
}, { timestamps: true });

module.exports = mongoose.model("Invoice", InvoiceSchema);