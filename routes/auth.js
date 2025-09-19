const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TeamMember = require("../models/TeamMember");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// ============================
// ✅ User Signup Route (Admin/Manager)
// ============================
router.post("/user/signup", async (req, res) => {
  const { fullName, phone, email, password, confirmPassword, role } = req.body;

  // Validation
  if (!fullName || !phone || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      fullName,
      phone,
      email,
      password: hashedPassword,
      role: role || "Manager" // Default role for User signup
    });

    const savedUser = await newUser.save();

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: savedUser._id,
        role: savedUser.role,
        userType: "User"
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: savedUser._id,
        fullName: savedUser.fullName,
        phone: savedUser.phone,
        email: savedUser.email,
        role: savedUser.role
      },
      token
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error during signup", details: err.message });
  }
});

// ============================
// ✅ TeamMember Signup Route (Employee)
// ============================
router.post("/member/signup", async (req, res) => {
  const { name, phone, email, password, confirmPassword, project, role } = req.body;

  if (!name || !phone || !email || !password || !confirmPassword || !project) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const existingMember = await TeamMember.findOne({ email });
    if (existingMember) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate employeeId
    const employeeId = "EMP" + Date.now();

    const newMember = new TeamMember({
      employeeId,
      name,
      phone,
      email,
      project,
      role: role || "Employee",
      password: hashedPassword
    });

    const savedMember = await newMember.save();

    const token = jwt.sign(
      { 
        memberId: savedMember._id,
        role: savedMember.role,
        userType: "TeamMember"
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "Team member created successfully",
      user: {
        id: savedMember._id,
        employeeId: savedMember.employeeId,
        name: savedMember.name,
        phone: savedMember.phone,
        email: savedMember.email,
        project: savedMember.project,
        role: savedMember.role,
        shift: savedMember.shift // Include shift information
      },
      token
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error during signup", details: err.message });
  }
});

// ============================
// ✅ Universal Login Route (Both User & TeamMember)
// ============================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // First try to find as User (Admin/Manager)
    let user = await User.findOne({ email }).select("+password");
    let userType = "User";

    // If not found as User, try as TeamMember (Employee)
    if (!user) {
      user = await TeamMember.findOne({ email }).select("+password");
      userType = "TeamMember";
    }

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        userType: userType
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Prepare response based on user type
    const userData = userType === "User" ? {
      id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role
    } : {
      id: user._id,
      employeeId: user.employeeId,
      name: user.name,
      phone: user.phone,
      email: user.email,
      project: user.project,
      role: user.role,
      shift: user.shift // Include shift information for TeamMembers
    };

    res.status(200).json({
      message: "Login successful",
      token,
      user: userData,
      userType
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login", details: err.message });
  }
});

// ============================
// ✅ Get User Details by ID
// ============================
router.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find as User first
    let user = await User.findById(id);
    let userType = "User";

    // If not found as User, try as TeamMember
    if (!user) {
      user = await TeamMember.findById(id);
      userType = "TeamMember";
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prepare response based on user type
    const userData = userType === "User" ? {
      id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      userType: "User"
    } : {
      id: user._id,
      employeeId: user.employeeId,
      name: user.name,
      phone: user.phone,
      email: user.email,
      project: user.project,
      role: user.role,
      shift: user.shift,
      userType: "TeamMember"
    };

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ============================
// ✅ Forget Password 
// ============================

// Store reset tokens temporarily (in production use DB or Redis)
const resetTokens = {};

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Check both User and TeamMember collections
    let user = await User.findOne({ email });
    let userType = "User";

    if (!user) {
      user = await TeamMember.findOne({ email });
      userType = "TeamMember";
    }

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      resetTokens[token] = { 
        userId: user._id, 
        userType: userType,
        expires: Date.now() + 3600000 
      }; // 1 hr

      // Send email
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const resetLink = `https://timesheetsbackend.myadminbuddy.com/reset-password/${token}`;

      await transporter.sendMail({
        to: email,
        subject: "Password Reset Request",
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
      });
    }

    // Always respond the same for security
    res.status(200).json({ message: "If that email exists, a reset link was sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
