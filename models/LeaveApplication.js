const mongoose = require("mongoose");

const leaveApplicationSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  supervisorName: { type: String, required: true },
  department: { type: String, required: true },
  leaveDate: { type: String, required: true },
  leaveTime: { type: String, required: true },
  leaveType: { type: String, required: true },
  duration: { type: String, required: true },
  selectedReasons: { type: [String], default: [] },
  otherReason: { type: String, default: "" },
  description: { type: String, default: "" },
  emergencyContact: { type: String, default: "" },
  emergencyPhone: { type: String, default: "" },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: String },
  comments: { type: String }
});

module.exports = mongoose.model("LeaveApplication", leaveApplicationSchema);
