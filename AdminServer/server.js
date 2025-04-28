const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const societyRoutes = require("./routes/societyRoutes");
const userRoutes = require("./routes/userRoutes");
const couponRoutes = require("./routes/couponRoutes");
const eventRoutes = require("./routes/eventRoutes");
const authRoutes = require("./routes/authRoutes");
const broadcastRoutes = require("./routes/broadcastRoutes");
const flatOwnerRoutes = require("./routes/flatOwnerRoutes");
const entryRoutes = require("./routes/entryRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const Admin = require("./models/Admin");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "5mb" })); // Increased limit for large base64 images
app.use(express.json());

// Routes
app.use("/api/societies", societyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/flats", flatOwnerRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/maintenance", maintenanceRoutes);

app.use((req, res) => {
  res.status(404).send("Route not found");
});

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/EKDD";

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected Successfully");
    await createSuperAdmin();
  })
  .catch((err) => console.error("❌ MongoDB Connection Failed", err));

// Create Super Admin if not exists
async function createSuperAdmin() {
  try {
    const superAdminExists = await Admin.findOne({ email: "dec@gmail.com" });
    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash("superadmin123", 10);
      const superAdmin = new Admin({
        name: "Super Admin",
        email: "dec@gmail.com",
        password: hashedPassword,
        phone: "1234567890",
        role: "superadmin",
      });
      await superAdmin.save();
      console.log("✅ Superadmin created");
    } else {
      console.log("⚡ Superadmin already exists");
    }
  } catch (error) {
    console.error("❌ Error creating Superadmin:", error);
  }
}

// Default route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// In server.js or app.js
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
