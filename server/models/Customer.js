const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  address: { type: String },

  balance: { type: Number, default: 0 }, // credit/due
  gstNumber: { type: String }, // optional for India

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Customer", customerSchema);