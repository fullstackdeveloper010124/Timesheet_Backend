const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: String,
  client: String,
  deadline: String,
  description: String,
  progress: { type: Number, default: 0 },
  team: { type: Number, default: 0 },
  hours: { type: Number, default: 0 },
  status: { type: String, default: "In Progress" },
});

module.exports = mongoose.model("Project", projectSchema);
