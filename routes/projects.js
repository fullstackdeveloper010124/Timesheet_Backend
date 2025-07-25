const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// GET all projects
router.get("/all", async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// POST create new project
router.post("/", async (req, res) => {
  try {
    const project = new Project(req.body);
    const saved = await project.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Failed to create project" });
  }
});

// PUT update project
router.put("/:id", async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Project not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update project" });
  }
});

// DELETE project
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete project" });
  }
});

module.exports = router;
