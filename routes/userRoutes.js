const express = require("express");
const bcrypt = require("bcryptjs");
const TeamMember = require("../models/TeamMembers");

const router = express.Router();

// =====================
// ✅ Signup Route (TeamMember)
// =====================
router.post("/signup", async (req, res) => {
  try {
    const { name, phone, email, password, confirmPassword, project, role } = req.body;

    if (!name || !phone || !email || !password || !confirmPassword || !project) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if already exists
    const existingUser = await TeamMember.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate employeeId (auto)
    const employeeId = "EMP" + Date.now();

    const newMember = new TeamMember({
      employeeId,
      name,
      phone,
      email,
      project,
      role: role || "Employee",
      password: hashedPassword // 👈 will store password inside TeamMembers
    });

    await newMember.save();

    res.status(201).json({ message: "Signup successful", user: newMember });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
