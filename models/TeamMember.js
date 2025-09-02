const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  password: { type: String, required: true, select: false },
  address: String,
  bankName: String,
  bankAddress: String,
  accountHolder: String,
  accountHolderAddress: String,
  account: String,
  accountType: String,
  charges: { type: Number, default: 0 },
  status: { type: String, default: "Active" },
  role: { type: String, enum: ["Employee", "Manager", "Admin"], default: "Employee" }
}, { timestamps: true });

module.exports = mongoose.model("TeamMember", teamMemberSchema);
