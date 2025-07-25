const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all user documents
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error while fetching users" });
  }
});

// POST a new user
router.post("/", async (req, res) => {
  try {
    const newUser = new User(req.body); // Create new User instance from request body
    const savedUser = await newUser.save(); // Save to DB
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ error: "Error while saving user", details: err.message });
  }
});

module.exports = router;
