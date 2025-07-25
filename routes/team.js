const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const TeamMember = require("../models/TeamMember");

// Add new team member
router.post("/add", async (req, res) => {
  try {
    const data = req.body;

    if (!data.name || !data.project || !data.email) {
      return res.status(400).json({ error: "Name, project, and email are required." });
    }

    const member = new TeamMember(data);
    await member.save();
    res.status(201).json({ message: "Team member added successfully", member });
  } catch (error) {
    console.error("Add Member Error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get all members with project name populated
router.get("/all", async (req, res) => {
  try {
    const members = await TeamMember.find().populate("project", "name");
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update member
router.put("/update/:id", async (req, res) => {
  try {
    const updated = await TeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update member" });
  }
});

// Delete member
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid member ID" });
  }

  try {
    const deleted = await TeamMember.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json({ message: "Member deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete member" });
  }
});

module.exports = router;
