const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables from .env
dotenv.config();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "user-role",
    "User-Role",
  ],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); // Parses incoming JSON requests

// Import Routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth");
const teamRoutes = require("./routes/team");
const projectRoutes = require("./routes/projects");
const leaveRoutes = require("./routes/leaveApplication");
const timeEntryRoutes = require("./routes/timeEntry");
const taskRoutes = require("./routes/tasks");
const shiftRoutes = require("./routes/shifts");

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Test endpoint to verify backend is working
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is working",
    timestamp: new Date().toISOString(),
  });
});

// Use Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/time-entries", timeEntryRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/shifts", shiftRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send("🚀 Backend API is running");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
