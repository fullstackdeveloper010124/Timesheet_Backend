const express = require("express");
const router = express.Router();
const LeaveApplication = require("../models/LeaveApplication");

// POST - Create new leave application
router.post("/", async (req, res) => {
  try {
    const newLeave = new LeaveApplication(req.body);
    const savedLeave = await newLeave.save();
    res.status(201).json({ message: "Leave request submitted", data: savedLeave });
  } catch (error) {
    console.error("Leave application error:", error);
    res.status(500).json({ error: "Failed to submit leave request", details: error.message });
  }
});

// GET - Fetch all leave applications
router.get("/", async (req, res) => {
  try {
    const leaves = await LeaveApplication.find();
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave applications" });
  }
});

// GET - Fetch leave application by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await LeaveApplication.findById(id);
    
    if (!leave) {
      return res.status(404).json({ error: "Leave application not found" });
    }
    
    res.status(200).json(leave);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave application" });
  }
});

// GET - Fetch leave applications by employee name
router.get("/employee/:employeeName", async (req, res) => {
  try {
    const { employeeName } = req.params;
    const leaves = await LeaveApplication.find({ employeeName: { $regex: employeeName, $options: 'i' } });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave applications" });
  }
});

// PUT - Update leave application status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments, reviewedBy } = req.body;
    
    const updatedLeave = await LeaveApplication.findByIdAndUpdate(
      id,
      { 
        status, 
        comments, 
        reviewedBy, 
        reviewedAt: new Date() 
      },
      { new: true }
    );
    
    if (!updatedLeave) {
      return res.status(404).json({ error: "Leave application not found" });
    }
    
    res.status(200).json({ message: "Status updated successfully", data: updatedLeave });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: "Failed to update status", details: error.message });
  }
});

// DELETE - Delete leave application
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLeave = await LeaveApplication.findByIdAndDelete(id);
    
    if (!deletedLeave) {
      return res.status(404).json({ error: "Leave application not found" });
    }
    
    res.status(200).json({ message: "Leave application deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete leave application", details: error.message });
  }
});



module.exports = router;

// const express = require("express");
// const router = express.Router();
// const LeaveApplication = require("../models/LeaveApplication");

// router.post("/", async (req, res) => {
//   try {
//     const newLeave = new LeaveApplication(req.body);
//     const savedLeave = await newLeave.save();
//     res.status(201).json({ message: "Leave request submitted", data: savedLeave });
//   } catch (error) {
//     console.error("Leave application error:", error);
//     res.status(500).json({ error: "Failed to submit leave request", details: error.message });
//   }
// });

// module.exports = router;

