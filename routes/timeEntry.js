const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');
const mongoose = require('mongoose');
const TeamMember = require('../models/TeamMember');

// =======================
// Get active timer by user
// =======================
router.get('/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userModel } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const query = { userId, status: 'In Progress' };
    if (userModel) query.userModel = userModel;

    const activeTimer = await TimeEntry.findOne(query)
      .populate('project', 'name client')
      .populate('task', 'name description')
      .populate('userId', 'name email');

    res.json({ success: true, data: activeTimer });
  } catch (error) {
    console.error('Get active timer error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active timer' });
  }
});

// =======================
// Get user total hours
// =======================
router.get('/user/:userId/total-hours', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const result = await TimeEntry.getUserTotalHours(userId, startDate, endDate);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get total hours error:', error);
    res.status(500).json({ success: false, error: 'Failed to get total hours' });
  }
});

// =======================
// Get all time entries
// =======================
router.get('/', async (req, res) => {
  try {
    const { userId, startDate, endDate, project, status } = req.query;

    let query = {};
    if (userId) query.userId = userId;
    if (project) query.project = project;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const timeEntries = await TimeEntry.find(query)
      .populate('project', 'name client')
      .populate('task', 'name description')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: timeEntries });
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch time entries' });
  }
});

// =======================
// Create new time entry
// =======================
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      project,
      task,
      description,
      startTime,
      endTime,
      billable,
      trackingType,
      isManualEntry,
      hourlyRate,
      userType
    } = req.body;

    if (!userId || !project || !task || !description || !startTime) {
      return res.status(400).json({ success: false, error: 'userId, project, task, description, and startTime are required' });
    }

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(project) ||
      !mongoose.Types.ObjectId.isValid(task)
    ) {
      return res.status(400).json({ success: false, error: 'Invalid userId, project, or task ID' });
    }

    const userModel = userType === 'TeamMember' ? 'TeamMember' : 'User';

    // Enforce assigned shift for TeamMember
    let trackingTypeToUse = trackingType || 'Hourly';
    if (userModel === 'TeamMember') {
      const member = await TeamMember.findById(userId).select('shift');
      if (!member) {
        return res.status(400).json({ success: false, error: 'Team member not found' });
      }
      trackingTypeToUse = member.shift;
    }

    const timeEntry = new TimeEntry({
      userId,
      userModel,
      project,
      task,
      description,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      billable: billable !== undefined ? billable : true,
      trackingType: trackingTypeToUse,
      isManualEntry: isManualEntry || false,
      hourlyRate: hourlyRate || 0,
      status: endTime ? 'Completed' : 'In Progress'
    });

    await timeEntry.save();
    console.log('✅ Time entry saved to database:', {
      id: timeEntry._id,
      userId: timeEntry.userId,
      project: timeEntry.project,
      duration: timeEntry.duration,
      status: timeEntry.status
    });

    await timeEntry.populate('project', 'name client');
    await timeEntry.populate('task', 'name description');
    await timeEntry.populate('userId', 'name email');

    res.status(201).json({ success: true, data: timeEntry, message: 'Time entry created successfully' });
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to create time entry' });
  }
});

// =======================
// Start timer
// =======================
router.post('/start', async (req, res) => {
  try {
    const { userId, project, task, description, trackingType, userType, hourlyRate } = req.body;

    if (!userId || !project || !task || !description) {
      return res.status(400).json({ success: false, error: 'userId, project, task, and description are required' });
    }

    const userModel = userType === 'TeamMember' ? 'TeamMember' : 'User';

    // Enforce assigned shift for TeamMember
    let trackingTypeToUse = trackingType || 'Hourly';
    if (userModel === 'TeamMember') {
      const member = await TeamMember.findById(userId).select('shift');
      if (!member) {
        return res.status(400).json({ success: false, error: 'Team member not found' });
      }
      trackingTypeToUse = member.shift;
    }

    // check if already active
    const activeTimer = await TimeEntry.findOne({ userId, userModel, status: 'In Progress' });
    if (activeTimer) {
      return res.status(400).json({ success: false, error: 'You already have an active timer. Please stop it first.' });
    }

    const timeEntry = new TimeEntry({
      userId,
      userModel,
      project,
      task,
      description,
      startTime: new Date(),
      trackingType: trackingTypeToUse,
      hourlyRate: hourlyRate || 0,
      status: 'In Progress'
    });

    await timeEntry.save();
    console.log('🚀 Timer started and saved to database:', {
      id: timeEntry._id,
      userId: timeEntry.userId,
      project: timeEntry.project,
      task: timeEntry.task,
      startTime: timeEntry.startTime,
      status: timeEntry.status
    });

    await timeEntry.populate('project', 'name client');
    await timeEntry.populate('task', 'name description');
    await timeEntry.populate('userId', 'name email');

    res.status(201).json({ success: true, data: timeEntry, message: 'Timer started successfully' });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({ success: false, error: 'Failed to start timer' });
  }
});

// =======================
// Stop timer
// =======================
router.put('/stop/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid time entry ID' });
    }

    const timeEntry = await TimeEntry.findById(id);
    if (!timeEntry) return res.status(404).json({ success: false, error: 'Time entry not found' });
    if (timeEntry.status !== 'In Progress') {
      return res.status(400).json({ success: false, error: 'Timer is not active' });
    }

    timeEntry.endTime = new Date();
    timeEntry.status = 'Completed';

    // Duration + billing calculate
    const duration = Math.round((timeEntry.endTime - timeEntry.startTime) / (1000 * 60));
    timeEntry.duration = duration;
    if (timeEntry.hourlyRate > 0 && timeEntry.billable) {
      timeEntry.totalAmount = (duration / 60) * timeEntry.hourlyRate;
    }

    await timeEntry.save();
    console.log('⏹️ Timer stopped and updated in database:', {
      id: timeEntry._id,
      userId: timeEntry.userId,
      duration: timeEntry.duration,
      totalAmount: timeEntry.totalAmount,
      status: timeEntry.status,
      endTime: timeEntry.endTime
    });

    await timeEntry.populate('project', 'name client');
    await timeEntry.populate('task', 'name description');
    await timeEntry.populate('userId', 'name email');

    res.json({ success: true, data: timeEntry, message: 'Timer stopped successfully' });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ success: false, error: 'Failed to stop timer' });
  }
});

// =======================
// Update time entry
// =======================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid time entry ID' });
    }

    let updateData = { ...req.body };

    // duration + totalAmount calculate
    if (updateData.startTime && updateData.endTime) {
      const start = new Date(updateData.startTime);
      const end = new Date(updateData.endTime);
      const duration = Math.round((end - start) / (1000 * 60));
      updateData.duration = duration;
      if (updateData.hourlyRate > 0 && updateData.billable) {
        updateData.totalAmount = (duration / 60) * updateData.hourlyRate;
      }
      updateData.status = 'Completed';
    }

    const timeEntry = await TimeEntry.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('project', 'name client')
      .populate('task', 'name description')
      .populate('userId', 'name email');

    if (!timeEntry) {
      return res.status(404).json({ success: false, error: 'Time entry not found' });
    }

    res.json({ success: true, data: timeEntry, message: 'Time entry updated successfully' });
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to update time entry' });
  }
});

// =======================
// Get time entry by ID
// =======================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid time entry ID' });
    }

    const timeEntry = await TimeEntry.findById(id)
      .populate('project', 'name client')
      .populate('task', 'name description')
      .populate('userId', 'name email');

    if (!timeEntry) {
      return res.status(404).json({ success: false, error: 'Time entry not found' });
    }

    res.json({ success: true, data: timeEntry });
  } catch (error) {
    console.error('Get time entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch time entry' });
  }
});

// =======================
// Create manual time entry
// =======================
router.post('/manual', async (req, res) => {
  try {
    const {
      userId,
      project,
      task,
      description,
      startTime,
      endTime,
      billable,
      hourlyRate,
      userType
    } = req.body;

    if (!userId || !project || !task || !description || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId, project, task, description, startTime, and endTime are required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || 
        !mongoose.Types.ObjectId.isValid(project) || 
        !mongoose.Types.ObjectId.isValid(task)) {
      return res.status(400).json({ success: false, error: 'Invalid userId, project, or task ID' });
    }

    const userModel = userType === 'TeamMember' ? 'TeamMember' : 'User';

    // Enforce assigned shift for TeamMember
    let trackingTypeToUse = 'Hourly';
    if (userModel === 'TeamMember') {
      const member = await TeamMember.findById(userId).select('shift');
      if (!member) {
        return res.status(400).json({ success: false, error: 'Team member not found' });
      }
      trackingTypeToUse = member.shift;
    }

    const timeEntry = new TimeEntry({
      userId,
      userModel,
      project,
      task,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      billable: billable !== undefined ? billable : true,
      trackingType: trackingTypeToUse,
      isManualEntry: true,
      hourlyRate: hourlyRate || 0,
      status: 'Completed'
    });

    await timeEntry.save();
    
    await timeEntry.populate('project', 'name client');
    await timeEntry.populate('task', 'name description');
    await timeEntry.populate('userId', 'name email');

    res.status(201).json({ success: true, data: timeEntry, message: 'Manual time entry created successfully' });
  } catch (error) {
    console.error('Create manual entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to create manual time entry' });
  }
});

// =======================
// Delete time entry
// =======================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid time entry ID' });
    }

    const timeEntry = await TimeEntry.findByIdAndDelete(id);
    if (!timeEntry) {
      return res.status(404).json({ success: false, error: 'Time entry not found' });
    }

    res.json({ success: true, message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete time entry' });
  }
});

module.exports = router;
