const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');
const mongoose = require('mongoose');

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

    if (!mongoose.Types.ObjectId.isValid(userId) || 
        !mongoose.Types.ObjectId.isValid(project) || 
        !mongoose.Types.ObjectId.isValid(task)) {
      return res.status(400).json({ success: false, error: 'Invalid userId, project, or task ID' });
    }

    const userModel = userType === 'TeamMember' ? 'TeamMember' : 'User';


    const timeEntry = new TimeEntry({
      userId,
      userModel,
      project,
      task,
      description,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      billable: billable !== undefined ? billable : true,
      trackingType: trackingType || 'Hourly',
      isManualEntry: isManualEntry || false,
      hourlyRate: hourlyRate || 0,
      status: endTime ? 'Completed' : 'In Progress'
    });

    await timeEntry.save();
    
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
// Start timer
// =======================
router.post('/start', async (req, res) => {
  try {
    const { userId, project, task, description, trackingType, userType, hourlyRate } = req.body;

    if (!userId || !project || !task || !description) {
      return res.status(400).json({ success: false, error: 'userId, project, task, and description are required' });
    }

    const userModel = userType === 'TeamMember' ? 'TeamMember' : 'User';


    const activeTimer = await TimeEntry.findOne({ userId, status: 'In Progress' });
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
      trackingType: trackingType || 'Hourly',
      hourlyRate: hourlyRate || 0,
      status: 'In Progress'
    });

    await timeEntry.save();
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
    await timeEntry.populate('project', 'name client');
    await timeEntry.populate('task', 'name description');
    await timeEntry.populate('userId', 'name email');

    res.json({ success: true, data: timeEntry, message: 'Timer stopped successfully' });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ success: false, error: 'Failed to stop timer' });
  }
});

module.exports = router;
