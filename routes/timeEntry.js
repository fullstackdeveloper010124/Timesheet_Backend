const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// =======================
// Get all time entries for a user
// =======================
router.get('/', async (req, res) => {
  try {
    const { userId, startDate, endDate, project, status } = req.query;
    
    let query = {};
    if (userId) query.userId = userId;
    if (project) query.project = project;
    if (status) query.status = status;
    
    // Date range filter
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
      hourlyRate
    } = req.body;

    // Validate required fields
    if (!userId || !project || !task || !description || !startTime) {
      return res.status(400).json({
        success: false,
        error: 'userId, project, task, description, and startTime are required'
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || 
        !mongoose.Types.ObjectId.isValid(project) || 
        !mongoose.Types.ObjectId.isValid(task)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid userId, project, or task ID'
      });
    }

    const timeEntry = new TimeEntry({
      userId,
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
    
    // Populate the response
    await timeEntry.populate('project', 'name client');
    await timeEntry.populate('task', 'name description');
    await timeEntry.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      data: timeEntry,
      message: 'Time entry created successfully'
    });
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to create time entry' });
  }
});

// =======================
// Update time entry (stop timer, edit entry)
// =======================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid time entry ID' });
    }

    const updateData = { ...req.body };
    
    // If endTime is provided, set status to Completed
    if (updateData.endTime) {
      updateData.endTime = new Date(updateData.endTime);
      updateData.status = 'Completed';
    }

    const timeEntry = await TimeEntry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('project', 'name client')
    .populate('task', 'name description')
    .populate('userId', 'name email');

    if (!timeEntry) {
      return res.status(404).json({ success: false, error: 'Time entry not found' });
    }

    res.json({
      success: true,
      data: timeEntry,
      message: 'Time entry updated successfully'
    });
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to update time entry' });
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

    res.json({
      success: true,
      message: 'Time entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete time entry' });
  }
});

// =======================
// Get user's time summary
// =======================
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await TimeEntry.getUserTotalHours(userId, start, end);
    
    // Get recent entries
    const recentEntries = await TimeEntry.find({
      userId,
      createdAt: { $gte: start, $lte: end }
    })
    .populate('project', 'name')
    .populate('task', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          totalHours: Math.round(summary.totalMinutes / 60 * 100) / 100,
          billableHours: Math.round(summary.billableMinutes / 60 * 100) / 100,
          totalEntries: summary.totalEntries,
          period: { start, end }
        },
        recentEntries
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to get time summary' });
  }
});

// =======================
// Start timer (create active time entry)
// =======================
router.post('/start', async (req, res) => {
  try {
    const { userId, project, task, description, trackingType } = req.body;

    // Validate required fields
    if (!userId || !project || !task || !description) {
      return res.status(400).json({
        success: false,
        error: 'userId, project, task, and description are required'
      });
    }

    // Check if user has any active timers
    const activeTimer = await TimeEntry.findOne({
      userId,
      status: 'In Progress'
    });

    if (activeTimer) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active timer. Please stop it first.'
      });
    }

    const timeEntry = new TimeEntry({
      userId,
      project,
      task,
      description,
      startTime: new Date(),
      trackingType: trackingType || 'Hourly',
      status: 'In Progress'
    });

    await timeEntry.save();
    await timeEntry.populate('project', 'name client');
    await timeEntry.populate('task', 'name description');

    res.status(201).json({
      success: true,
      data: timeEntry,
      message: 'Timer started successfully'
    });
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
    
    if (!timeEntry) {
      return res.status(404).json({ success: false, error: 'Time entry not found' });
    }

    if (timeEntry.status !== 'In Progress') {
      return res.status(400).json({ success: false, error: 'Timer is not active' });
    }

    timeEntry.endTime = new Date();
    timeEntry.status = 'Completed';
    await timeEntry.save();

    await timeEntry.populate('project', 'name client');
    await timeEntry.populate('task', 'name description');

    res.json({
      success: true,
      data: timeEntry,
      message: 'Timer stopped successfully'
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ success: false, error: 'Failed to stop timer' });
  }
});

module.exports = router;
