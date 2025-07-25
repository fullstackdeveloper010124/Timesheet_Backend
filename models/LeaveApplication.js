const mongoose = require("mongoose");

const leaveApplicationSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  supervisorName: { type: String, required: true },
  department: { type: String, required: true },
  leaveDate: { type: String, required: true },
  leaveTime: { type: String, required: true },
  selectedReasons: { type: [String], default: [] },
  otherReason: { type: String, default: "" },
});

module.exports = mongoose.model("LeaveApplication", leaveApplicationSchema);
