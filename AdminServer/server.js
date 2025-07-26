const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
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
const guardRoutes = require("./routes/guardRoutes");
const serviceEntryRoutes = require("./routes/serviceEntryRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const Admin = require("./models/Admin");

const app = express();

// CORS configuration for multiple origins
const allowedOrigins = [
  "https://entrykart-user-module.vercel.app",
  "https://entry-kart-admin.vercel.app",
  "https://security-module-chi.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) or from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Middleware
app.use(express.json({ limit: "5mb" })); // Replaced bodyParser.json()
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

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
app.use("/api/guard", guardRoutes);
app.use("/api/service-entries", serviceEntryRoutes);
app.use("/api/vehicles", vehicleRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Default route
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://jatinbendale17:EhX4qk9HoMRKgrCg@cluster0.ru841.mongodb.net/EntryKart";

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ MongoDB Connected Successfully");
    await createSuperAdmin();
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed", err);
    process.exit(1);
  });

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server...");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed.");
    process.exit(0);
  });
});