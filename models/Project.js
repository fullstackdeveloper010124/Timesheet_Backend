const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date },
  deadline: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  team: { type: Number, default: 0 },
  hours: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'on-hold', 'In Progress'], 
    default: 'active' 
  },
  assignedTeam: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' }],
  budget: { type: Number, default: 0 },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Project", projectSchema);
