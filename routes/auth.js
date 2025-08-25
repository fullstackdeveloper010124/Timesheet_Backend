// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const crypto = require("crypto");
// const nodemailer = require("nodemailer");

// // ============================
// // ✅ Signup Route
// // ============================
// router.post("/signup", async (req, res) => {
//   const { firstName, lastName, phone, email, password, confirmPassword } = req.body;

//   // Validation
//   if (!firstName || !lastName || !phone || !email || !password || !confirmPassword) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   if (password.length < 6) {
//     return res.status(400).json({ error: "Password must be at least 6 characters" });
//   }

//   if (password !== confirmPassword) {
//     return res.status(400).json({ error: "Passwords do not match" });
//   }

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ error: "Email already registered" });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user
//     const newUser = new User({
//       firstName,
//       lastName,
//       phone,
//       email,
//       password: hashedPassword
//     });

//     const savedUser = await newUser.save();

//     // Generate JWT
//     const token = jwt.sign(
//       { userId: savedUser._id },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.status(201).json({
//       message: "User created successfully",
//       user: {
//         id: savedUser._id,
//         firstName: savedUser.firstname,
//         lastName: savedUser.lastname,
//         phone: savedUser.phone,
//         email: savedUser.email,
//       },
//       token
//     });
//   } catch (err) {
//     console.error("Signup error:", err);
//     res.status(500).json({ error: "Server error during signup", details: err.message });
//   }
// });

// // ============================
// // ✅ Login Route
// // ============================
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   // Validation
//   if (!email || !password) {
//     return res.status(400).json({ error: "Email and password are required" });
//   }

//   try {
//     // Find user
//     const user = await User.findOne({ email }).select("+password");
//     if (!user) {
//       return res.status(400).json({ error: "Invalid credentials" });
//     }

//     // Compare password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ error: "Invalid credentials" });
//     }

//     // Generate JWT
//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.status(200).json({
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email
//       }
//     });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: "Server error during login", details: err.message });
//   }
// });

// // ============================
// // ✅ Forget Password 
// // ============================

// // Store reset tokens temporarily (in production use DB or Redis)
// const resetTokens = {};

// router.post("/forgot-password", async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });

//     if (user) {
//       const token = crypto.randomBytes(32).toString("hex");
//       resetTokens[token] = { userId: user._id, expires: Date.now() + 3600000 }; // 1 hr

//       // Send email
//       const transporter = nodemailer.createTransport({
//         service: "Gmail",
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS,
//         },
//       });

//       const resetLink = `https://timesheetsbackend.myadminbuddy.com/reset-password/${token}`;

//       await transporter.sendMail({
//         to: email,
//         subject: "Password Reset Request",
//         html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
//       });
//     }

//     // Always respond the same for security
//     res.status(200).json({ message: "If that email exists, a reset link was sent." });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;


router.post("/signup", async (req, res) => {
  const { fullName, phone, email, password, confirmPassword } = req.body;

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      phone,
      email,
      password: hashedPassword
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      { userId: savedUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: savedUser._id,
        fullName: savedUser.fullName,
        phone: savedUser.phone,
        email: savedUser.email,
      },
      token
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error during signup", details: err.message });
  }
});
