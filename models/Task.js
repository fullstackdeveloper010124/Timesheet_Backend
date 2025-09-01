const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed', 'on-hold'],
    default: 'todo'
  },
  estimatedHours: {
    type: Number,
    default: 0
  },
  actualHours: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });

// Virtual for completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  if (this.estimatedHours === 0) return 0;
  return Math.min(100, Math.round((this.actualHours / this.estimatedHours) * 100));
});

// Static method to get tasks by project
taskSchema.statics.getByProject = function(projectId, status = null) {
  const query = { project: projectId, isActive: true };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('assignedTo', 'name email')
    .populate('project', 'name')
    .sort({ priority: -1, createdAt: -1 });
};

// Static method to get user's tasks
taskSchema.statics.getUserTasks = function(userId, status = null) {
  const query = { assignedTo: userId, isActive: true };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('project', 'name client')
    .sort({ priority: -1, dueDate: 1 });
};

module.exports = mongoose.model('Task', taskSchema);
