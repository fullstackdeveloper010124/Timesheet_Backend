const express = require("express");
const router = express.Router();
const LeaveApplication = require("../models/LeaveApplication");

// POST - Create new leave application
router.post("/", async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['employeeName', 'supervisorName', 'department', 'leaveDate', 'leaveTime', 'leaveType', 'duration'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        missingFields,
        message: `Please provide: ${missingFields.join(', ')}`
      });
    }

    // Validate that at least one reason is provided
    if ((!req.body.selectedReasons || req.body.selectedReasons.length === 0) && !req.body.otherReason) {
      return res.status(400).json({ 
        error: "Validation failed", 
        message: "Please provide at least one reason for leave"
      });
    }

    // Create new leave application
    const newLeave = new LeaveApplication({
      ...req.body,
      status: 'pending',
      submittedAt: new Date()
    });

    const savedLeave = await newLeave.save();
    
    console.log("Leave application submitted successfully:", savedLeave);
    
    res.status(201).json({ 
      success: true,
      message: "Leave request submitted successfully", 
      data: savedLeave,
      applicationId: savedLeave._id
    });
  } catch (error) {
    console.error("Leave application error:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation failed", 
        message: error.message,
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ 
      error: "Failed to submit leave request", 
      message: "Internal server error. Please try again later.",
      details: error.message 
    });
  }
});

// GET - Optional: Fetch all leave applications
router.get("/", async (req, res) => {
  try {
    const { status, department, employeeName } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (employeeName) filter.employeeName = { $regex: employeeName, $options: 'i' };
    
    const leaves = await LeaveApplication.find(filter)
      .sort({ submittedAt: -1 })
      .limit(100);
    
    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    console.error("Fetch leave applications error:", error);
    res.status(500).json({ 
      error: "Failed to fetch leave applications",
      message: "Internal server error. Please try again later."
    });
  }
});

// GET - Fetch leave application by ID
router.get("/:id", async (req, res) => {
  try {
    const leave = await LeaveApplication.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({ 
        error: "Not found", 
        message: "Leave application not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    console.error("Fetch leave application error:", error);
    res.status(500).json({ 
      error: "Failed to fetch leave application",
      message: "Internal server error. Please try again later."
    });
  }
});

// PUT - Update leave application status (for HR/Admin)
router.put("/:id/status", async (req, res) => {
  try {
    const { status, comments, reviewedBy } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status", 
        message: "Status must be 'approved' or 'rejected'" 
      });
    }
    
    const updatedLeave = await LeaveApplication.findByIdAndUpdate(
      req.params.id,
      {
        status,
        comments,
        reviewedBy,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedLeave) {
      return res.status(404).json({ 
        error: "Not found", 
        message: "Leave application not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Leave application ${status} successfully`,
      data: updatedLeave
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave applications" });
  }
});



module.exports = router;

