const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'TeamMember']   // ✅ এখন ঠিক হলো
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0
  },
  billable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Paused'],
    default: 'In Progress'
  },
  trackingType: {
    type: String,
    enum: ['Hourly', 'Daily', 'Weekly', 'Monthly'],
    default: 'Hourly'
  },
  isManualEntry: {
    type: Boolean,
    default: false
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate duration + amount before save
timeEntrySchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // minutes
    
    if (this.hourlyRate > 0 && this.billable) {
      this.totalAmount = (this.duration / 60) * this.hourlyRate;
    }
  }
  next();
});

// Index for performance
timeEntrySchema.index({ userId: 1, createdAt: -1 });
timeEntrySchema.index({ project: 1, task: 1 });

// Instance method: formatted duration
timeEntrySchema.methods.getFormattedDuration = function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  const seconds = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Static method: total hours
timeEntrySchema.statics.getUserTotalHours = async function(userId, startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: '$duration' },
        totalEntries: { $sum: 1 },
        billableMinutes: {
          $sum: {
            $cond: [{ $eq: ['$billable', true] }, '$duration', 0]
          }
        }
      }
    }
  ]);
  
  return result[0] || { totalMinutes: 0, totalEntries: 0, billableMinutes: 0 };
};

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
