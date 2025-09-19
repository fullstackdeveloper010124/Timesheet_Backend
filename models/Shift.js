const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "TeamMember", 
    required: true 
  },
  shiftType: { 
    type: String, 
    enum: ["Hourly", "Daily", "Weekly", "Monthly"], 
    required: true 
  },
  startTime: { 
    type: String, // Format: "09:00"
    default: "09:00" 
  },
  endTime: { 
    type: String, // Format: "17:00"
    default: "17:00" 
  },
  workingDays: [{
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  assignedDate: { 
    type: Date, 
    default: Date.now 
  },
  description: String,
  // Hourly shift specific fields
  hoursPerDay: { 
    type: Number, 
    default: 8 
  },
  // Daily shift specific fields
  daysPerWeek: { 
    type: Number, 
    default: 5 
  },
  // Weekly shift specific fields
  weeksPerMonth: { 
    type: Number, 
    default: 4 
  },
  // Monthly shift specific fields
  monthlyHours: { 
    type: Number, 
    default: 160 
  }
}, { timestamps: true });

// Index for efficient queries
shiftSchema.index({ employeeId: 1, isActive: 1 });

module.exports = mongoose.model("Shift", shiftSchema);
