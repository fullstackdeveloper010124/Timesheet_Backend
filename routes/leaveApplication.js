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

// GET - Optional: Fetch all leave applications
router.get("/", async (req, res) => {
  try {
    const leaves = await LeaveApplication.find();
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave applications" });
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

