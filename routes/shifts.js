const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const TeamMember = require('../models/TeamMember');

// Get shift for a specific employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const shift = await Shift.findOne({ 
      employeeId, 
      isActive: true 
    }).populate('employeeId', 'name email employeeId');
    
    if (!shift) {
      // If no shift assigned, return default shift from TeamMember
      const teamMember = await TeamMember.findById(employeeId);
      if (teamMember) {
        return res.json({
          success: true,
          data: {
            shiftType: teamMember.shift || 'Monthly',
            isDefault: true,
            employeeId: teamMember._id,
            startTime: '09:00',
            endTime: '17:00',
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          }
        });
      }
      return res.status(404).json({ success: false, error: 'No shift found for employee' });
    }
    
    res.json({ success: true, data: shift });
  } catch (error) {
    console.error('Error fetching employee shift:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assign or update shift for an employee
router.post('/assign', async (req, res) => {
  try {
    const {
      employeeId,
      shiftType,
      startTime,
      endTime,
      workingDays,
      description,
      hoursPerDay,
      daysPerWeek,
      weeksPerMonth,
      monthlyHours,
      assignedBy
    } = req.body;

    // Validate required fields
    if (!employeeId || !shiftType || !assignedBy) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee ID, shift type, and assigned by are required' 
      });
    }

    // Check if employee exists
    const employee = await TeamMember.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // Deactivate existing shifts for this employee
    await Shift.updateMany(
      { employeeId, isActive: true },
      { isActive: false }
    );

    // Create new shift
    const newShift = new Shift({
      employeeId,
      shiftType,
      startTime: startTime || '09:00',
      endTime: endTime || '17:00',
      workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      description,
      hoursPerDay: hoursPerDay || 8,
      daysPerWeek: daysPerWeek || 5,
      weeksPerMonth: weeksPerMonth || 4,
      monthlyHours: monthlyHours || 160,
      assignedBy,
      isActive: true
    });

    const savedShift = await newShift.save();
    
    // Also update the shift field in TeamMember for backward compatibility
    await TeamMember.findByIdAndUpdate(employeeId, { shift: shiftType });

    const populatedShift = await Shift.findById(savedShift._id)
      .populate('employeeId', 'name email employeeId')
      .populate('assignedBy', 'name email');

    res.json({ success: true, data: populatedShift });
  } catch (error) {
    console.error('Error assigning shift:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all shifts (for admin)
router.get('/all', async (req, res) => {
  try {
    const shifts = await Shift.find({ isActive: true })
      .populate('employeeId', 'name email employeeId')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: shifts });
  } catch (error) {
    console.error('Error fetching all shifts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update shift
router.put('/:shiftId', async (req, res) => {
  try {
    const { shiftId } = req.params;
    const updateData = req.body;

    const updatedShift = await Shift.findByIdAndUpdate(
      shiftId,
      updateData,
      { new: true }
    ).populate('employeeId', 'name email employeeId')
     .populate('assignedBy', 'name email');

    if (!updatedShift) {
      return res.status(404).json({ success: false, error: 'Shift not found' });
    }

    // Update TeamMember shift field if shiftType changed
    if (updateData.shiftType) {
      await TeamMember.findByIdAndUpdate(updatedShift.employeeId._id, { 
        shift: updateData.shiftType 
      });
    }

    res.json({ success: true, data: updatedShift });
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete shift (deactivate)
router.delete('/:shiftId', async (req, res) => {
  try {
    const { shiftId } = req.params;

    const shift = await Shift.findByIdAndUpdate(
      shiftId,
      { isActive: false },
      { new: true }
    );

    if (!shift) {
      return res.status(404).json({ success: false, error: 'Shift not found' });
    }

    res.json({ success: true, message: 'Shift deactivated successfully' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get shift history for an employee
router.get('/history/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const shifts = await Shift.find({ employeeId })
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: shifts });
  } catch (error) {
    console.error('Error fetching shift history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
