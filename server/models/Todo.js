const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema({
  text: String,
  completed: Boolean,
  targetDate: String
});

module.exports = mongoose.model("Todo", TodoSchema);