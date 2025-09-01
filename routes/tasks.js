const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// =======================
// Get all tasks
// =======================
router.get('/', async (req, res) => {
  try {
    const { project, assignedTo, status } = req.query;
    
    let query = { isActive: true };
    if (project) query.project = project;
    if (assignedTo) query.assignedTo = assignedTo;
    if (status) query.status = status;
    
    const tasks = await Task.find(query)
      .populate('project', 'name client')
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, createdAt: -1 });
    
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

// =======================
// Get tasks by project
// =======================
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, error: 'Invalid project ID' });
    }
    
    const tasks = await Task.getByProject(projectId, status);
    
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch project tasks' });
  }
});

// =======================
// Get user's tasks
// =======================
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    
    const tasks = await Task.getUserTasks(userId, status);
    
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user tasks' });
  }
});

// =======================
// Create new task
// =======================
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      project,
      assignedTo,
      priority,
      estimatedHours,
      dueDate,
      tags
    } = req.body;

    // Validate required fields
    if (!name || !project) {
      return res.status(400).json({
        success: false,
        error: 'Name and project are required'
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(project)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID'
      });
    }

    if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assignedTo user ID'
      });
    }

    const task = new Task({
      name,
      description,
      project,
      assignedTo,
      priority: priority || 'medium',
      estimatedHours: estimatedHours || 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: tags || []
    });

    await task.save();
    
    // Populate the response
    await task.populate('project', 'name client');
    await task.populate('assignedTo', 'name email');

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

// =======================
// Update task
// =======================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid task ID' });
    }

    const updateData = { ...req.body };
    
    // Convert dueDate to Date object if provided
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const task = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('project', 'name client')
    .populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

// =======================
// Delete task (soft delete)
// =======================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid task ID' });
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

// =======================
// Get task by ID
// =======================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid task ID' });
    }

    const task = await Task.findById(id)
      .populate('project', 'name client description')
      .populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch task' });
  }
});

module.exports = router;
