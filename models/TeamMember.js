const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true }, // Replaced role
  email: { type: String, required: true },
  phone: String,
  address: String,
  bankName: String,
  bankAddress: String,
  accountHolder: String,
  accountHolderAddress: String,
  account: String,
  accountType: String,
  hoursThisWeek: { type: Number, default: 0 },
  status: { type: String, default: "Active" }
});

module.exports = mongoose.model("TeamMember", teamMemberSchema);
