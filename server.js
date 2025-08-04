const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables from .env
dotenv.config();

const app = express();
// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Import Routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth");
const teamRoutes = require("./routes/team");
const projectRoutes = require("./routes/projects");
const leaveRoutes = require("./routes/leaveApplication");


// MongoDB Connection 
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Use Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/leave", leaveRoutes);



// Root Route
app.get("/", (req, res) => {
  res.send("🚀 Backend API is running");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
