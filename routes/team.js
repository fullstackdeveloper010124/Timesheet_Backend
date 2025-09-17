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
// Get all members (including signup users)
// =======================
router.get("/all", async (req, res) => {
  try {
    // Get team members from TeamMember collection
    const teamMembers = await TeamMember.find().populate("project", "name");
    
    // Get users from User collection (signup data)
    const User = require("../models/User");
    const signupUsers = await User.find();
    
    // Convert signup users to team member format with unique employee IDs
    const convertedUsers = signupUsers.map((user, index) => {
      let employeeId;
      switch(user.role) {
        case 'Admin':
          employeeId = `ADM${String(index + 1).padStart(3, '0')}`;
          break;
        case 'Manager':
          employeeId = `MGR${String(index + 1).padStart(3, '0')}`;
          break;
        default:
          employeeId = `EMP${String(index + 1).padStart(3, '0')}`;
      }
      
      return {
        _id: user._id,
        employeeId: employeeId,
        name: user.fullName || user.name,
        project: user.role === 'Admin' || user.role === 'Manager' ? 'Management' : 'N/A',
        email: user.email,
        phone: user.phone || '',
        address: '',
        bankName: '',
        bankAddress: '',
        accountHolder: '',
        accountHolderAddress: '',
        account: '',
        accountType: '',
        charges: user.role === 'Admin' ? 100 : user.role === 'Manager' ? 75 : 50,
        status: 'Active',
        role: user.role,
        shift: user.role === 'Admin' ? 'Monthly' : user.role === 'Manager' ? 'Weekly' : 'Hourly',
        isUser: true, // Flag to identify signup users
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date()
      };
    });
    
    // Combine both collections
    const allMembers = [...convertedUsers, ...teamMembers];
    
    res.json(allMembers);
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

    // Get current user role from token/header for permission check
    const currentUserRole = req.headers['user-role'] || 'Employee';
    
    console.log('Update request - ID:', id, 'currentUserRole:', currentUserRole, 'body:', req.body);
    
    // First, find the target member to check their role
    let targetMember = await TeamMember.findById(id);
    let targetRole = 'Employee';
    let isUserRecord = false;
    
    if (!targetMember) {
      const User = require("../models/User");
      const targetUser = await User.findById(id);
      if (targetUser) {
        targetRole = targetUser.role || 'Employee';
        isUserRecord = true;
        console.log('Found user record:', { id: targetUser._id, role: targetUser.role, fullName: targetUser.fullName });
      } else {
        console.log('Member not found in either collection for ID:', id);
        return res.status(404).json({ error: "Member not found in either collection" });
      }
    } else {
      targetRole = targetMember.role || 'Employee';
      console.log('Found team member record:', { id: targetMember._id, role: targetMember.role, name: targetMember.name });
    }
    
    console.log('Target role:', targetRole, 'isUserRecord:', isUserRecord);
    
    // Permission check
    if (currentUserRole === 'Employee') {
      return res.status(403).json({ error: "Employees cannot edit any members" });
    }
    
    if (currentUserRole === 'Manager' && targetRole !== 'Employee') {
      return res.status(403).json({ error: "Managers can only edit employees" });
    }

    let updated;
    
    if (isUserRecord) {
      // Update in User collection
      const User = require("../models/User");
      
      // Map team member fields to user fields
      const userUpdateData = {};
      if (req.body.name) userUpdateData.fullName = req.body.name;
      if (req.body.email) userUpdateData.email = req.body.email;
      if (req.body.phone) userUpdateData.phone = req.body.phone;
      if (req.body.role) userUpdateData.role = req.body.role;
      
      console.log('Updating User collection with data:', userUpdateData);
      updated = await User.findByIdAndUpdate(id, userUpdateData, { new: true });
      
      if (!updated) {
        console.log('Failed to update User record with ID:', id);
        return res.status(404).json({ error: "Failed to update user record" });
      }
      
      console.log('Successfully updated User record:', updated);
      
      // Convert user back to team member format for consistent response
      updated = {
        _id: updated._id,
        employeeId: req.body.employeeId || `${updated.role === 'Admin' ? 'ADM' : updated.role === 'Manager' ? 'MGR' : 'EMP'}001`,
        name: updated.fullName || updated.name,
        project: updated.role === 'Admin' || updated.role === 'Manager' ? 'Management' : 'N/A',
        email: updated.email,
        phone: updated.phone || '',
        address: req.body.address || '',
        bankName: req.body.bankName || '',
        bankAddress: req.body.bankAddress || '',
        accountHolder: req.body.accountHolder || '',
        accountHolderAddress: req.body.accountHolderAddress || '',
        account: req.body.account || '',
        accountType: req.body.accountType || '',
        charges: req.body.charges || (updated.role === 'Admin' ? 100 : updated.role === 'Manager' ? 75 : 50),
        status: req.body.status || 'Active',
        role: updated.role,
        shift: req.body.shift || (updated.role === 'Admin' ? 'Monthly' : updated.role === 'Manager' ? 'Weekly' : 'Hourly'),
        isUser: true,
        createdAt: updated.createdAt || new Date(),
        updatedAt: new Date()
      };
    } else {
      // Update in TeamMember collection
      updated = await TeamMember.findByIdAndUpdate(id, req.body, { new: true });
      
      if (!updated) {
        console.log('Failed to update TeamMember record with ID:', id);
        return res.status(404).json({ error: "Failed to update team member record" });
      }
      
      console.log('Successfully updated TeamMember record:', updated);
    }

    res.json({ message: "Member updated", member: updated });
  } catch (err) {
    console.error("Update member error:", err);
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
    // Get current user role from token/header for permission check
    const currentUserRole = req.headers['user-role'] || 'Employee';
    
    // First, find the target member to check their role
    let targetMember = await TeamMember.findById(id);
    let targetRole = 'Employee';
    
    if (!targetMember) {
      const User = require("../models/User");
      const targetUser = await User.findById(id);
      if (targetUser) {
        targetRole = targetUser.role || 'Employee';
      }
    } else {
      targetRole = targetMember.role || 'Employee';
    }
    
    // Permission check
    if (currentUserRole === 'Employee') {
      return res.status(403).json({ error: "Employees cannot delete any members" });
    }
    
    if (currentUserRole === 'Manager' && targetRole !== 'Employee') {
      return res.status(403).json({ error: "Managers can only delete employees" });
    }

    // First try to delete from TeamMember collection
    let deleted = await TeamMember.findByIdAndDelete(id);
    
    if (!deleted) {
      // If not found in TeamMember, try deleting from User collection
      const User = require("../models/User");
      deleted = await User.findByIdAndDelete(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Member not found in either collection" });
      }
    }

    res.json({ message: "Member deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete member", details: err.message });
  }
});



module.exports = router;
