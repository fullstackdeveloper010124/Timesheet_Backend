const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// GET all projects
router.get("/all", async (req, res) => {
  try {
    const projects = await Project.find().populate('assignedTeam', 'name email');
    res.json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Failed to fetch projects", details: err.message });
  }
});

// GET project by ID
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('assignedTeam', 'name email');
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ error: "Failed to fetch project", details: err.message });
  }
});

// POST create new project
router.post("/", async (req, res) => {
  try {
    console.log("Received project data:", req.body);
    
    // Validate required fields
    const { name, client, description } = req.body;
    if (!name || !client || !description) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        required: ['name', 'client', 'description'] 
      });
    }

    // Convert date strings to Date objects if provided
    const projectData = { ...req.body };
    if (projectData.startDate) {
      projectData.startDate = new Date(projectData.startDate);
    }
    if (projectData.endDate) {
      projectData.endDate = new Date(projectData.endDate);
    }
    if (projectData.deadline) {
      projectData.deadline = new Date(projectData.deadline);
    }

    const project = new Project(projectData);
    const saved = await project.save();
    console.log("Project saved successfully:", saved);
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(400).json({ error: "Failed to create project", details: err.message });
  }
});

// PUT update project
router.put("/:id", async (req, res) => {
  try {
    const projectData = { ...req.body };
    
    // Convert date strings to Date objects if provided
    if (projectData.startDate) {
      projectData.startDate = new Date(projectData.startDate);
    }
    if (projectData.endDate) {
      projectData.endDate = new Date(projectData.endDate);
    }
    if (projectData.deadline) {
      projectData.deadline = new Date(projectData.deadline);
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id, 
      projectData, 
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json(updated);
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(400).json({ error: "Failed to update project", details: err.message });
  }
});

// DELETE project
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(400).json({ error: "Failed to delete project", details: err.message });
  }
});

module.exports = router;
