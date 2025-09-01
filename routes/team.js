// routes/team.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const TeamMember = require("../models/TeamMember");

// Helper: Auto-generate employeeId like EMP001, EMP002
async function generateEmployeeId() {
  try {
    // Find the highest existing employee ID
    const lastMember = await TeamMember.findOne().sort({ employeeId: -1 });
    
    if (!lastMember || !lastMember.employeeId) {
      return "EMP001";
    }

    // Extract the number from the last employee ID
    const idMatch = lastMember.employeeId.match(/EMP(\d+)/);
    if (!idMatch) {
      // If the format is unexpected, start from 1
      return "EMP001";
    }

    const lastNum = parseInt(idMatch[1]);
    const nextNum = lastNum + 1;
    
    // Format with leading zeros (EMP001, EMP002, etc.)
    return "EMP" + String(nextNum).padStart(3, '0');
  } catch (error) {
    console.error("Error generating employee ID:", error);
    // Fallback to timestamp-based ID if there's an error
    return "EMP" + Date.now().toString().slice(-3);
  }
}

// =======================
// Add new team member
// =======================
router.post("/add", async (req, res) => {
  try {
    const data = req.body;

    if (!data.name || !data.project || !data.email || !data.role) {
      return res.status(400).json({
        error: "Name, project, email, and role are required.",
      });
    }

    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(data.project)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }

    // Auto-generate employeeId
    data.employeeId = await generateEmployeeId();

    const member = new TeamMember(data);
    await member.save();

    res.status(201).json({
      message: "Team member added successfully",
      member,
    });
  } catch (error) {
    console.error("Add Member Error:", error);
    res.status(500).json({ error: "Failed to add member", details: error.message });
  }
});

// =======================
// Get all members
// =======================
router.get("/all", async (req, res) => {
  try {
    const members = await TeamMember.find().populate("project", "name");
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// =======================
// Get single member by ID
// =======================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const member = await TeamMember.findById(id).populate("project", "name");
    if (!member) return res.status(404).json({ error: "Member not found" });

    res.json(member);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// =======================
// Update member
// =======================
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const updated = await TeamMember.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Member not found" });

    res.json({ message: "Member updated", member: updated });
  } catch (err) {
    res.status(400).json({ error: "Failed to update member", details: err.message });
  }
});

// =======================
// Delete member
// =======================
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid member ID" });
  }

  try {
    const deleted = await TeamMember.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Member not found" });

    res.json({ message: "Member deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete member", details: err.message });
  }
});



module.exports = router;
