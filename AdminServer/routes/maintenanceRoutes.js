const express = require("express");
const router = express.Router();
const Maintenance = require("../models/Maintenance");
const FlatOwner = require("../models/FlatOwner");
const Admin = require("../models/Admin");
const Society = require("../models/Society");

const MONTHLY_MAINTENANCE_AMOUNT = 1000;
const PENALTY_RATE = 0.1; // 10% per 7 days
const PENALTY_GRACE_DAY = 10; // No penalty until 10th of the month
const NEW_RECORD_CREATION_DAY = 25; // Create next month's record after this day

// Utility function to calculate penalty
const calculatePenalty = (baseAmount, dueDate, currentDate) => {
  if (
    currentDate.getDate() <= PENALTY_GRACE_DAY &&
    currentDate.getMonth() === dueDate.getMonth() &&
    currentDate.getFullYear() === dueDate.getFullYear()
  ) {
    return 0;
  }

  const tenthOfMonth = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    PENALTY_GRACE_DAY
  );
  const daysLate = Math.floor(
    (currentDate - tenthOfMonth) / (1000 * 60 * 60 * 24)
  );

  if (daysLate <= 0) return 0;

  const penaltyPeriods = Math.ceil(daysLate / 7); // 7 days
  return baseAmount * PENALTY_RATE * penaltyPeriods;
};

// GET /api/maintenance/count?email=admin@example.com (Admin-only)
router.get("/count", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail) {
      return res.status(400).json({ error: "Admin email is required" });
    }
    const admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      // console.log(`Admin not found for email: ${adminEmail}`);
      return res.status(404).json({ error: "Admin not found" });
    }

    let filter = {};
    if (admin.role !== "superadmin") {
      // Get societies assigned to the admin
      const societies = await Society.find({ adminEmail }, "name");
      const societyNames = societies.map((society) =>
        society.name.toLowerCase().trim()
      );
      if (societyNames.length === 0) {
        // console.log(`No societies found for admin: ${adminEmail}`);
        return res.status(200).json({ count: 0 });
      }
      filter.societyName = { $in: societyNames };
    }

    const count = await Maintenance.countDocuments(filter);
    // console.log(`Maintenance record count for admin ${adminEmail} (role: ${admin.role}): ${count}`);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching payment count:", error.message);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// GET maintenance details for a user by email (Used by owners)
router.get("/maintenance/:email", async (req, res) => {
  try {
    const owner = await FlatOwner.findOne({ email: req.params.email });
    if (!owner) {
      // console.log(`Owner not found for email: ${req.params.email}`);
      return res.status(404).json({ message: "Owner not found" });
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let maintenance = await Maintenance.findOne({
      ownerId: owner._id,
      dueDate: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1),
      },
    }).sort({ dueDate: -1 });

    if (!maintenance) {
      // console.log(`No maintenance record found for ${owner.email} in ${currentYear}-${currentMonth + 1}. Creating new record.`);
      maintenance = new Maintenance({
        ownerId: owner._id,
        societyName: owner.societyName,
        flatNumber: owner.flatNumber,
        amount: MONTHLY_MAINTENANCE_AMOUNT,
        dueDate: new Date(currentYear, currentMonth, 10),
        status: "Pending",
        penalty: 0,
        adminEmail: owner.adminEmail,
      });
      await maintenance.save();
      // console.log(`Created new maintenance record: ${maintenance._id}`);
    }

    if (maintenance.status !== "Paid") {
      const dueDate = new Date(maintenance.dueDate);
      if (
        currentDate > dueDate ||
        (currentDate.getDate() > PENALTY_GRACE_DAY &&
          currentDate.getMonth() === dueDate.getMonth())
      ) {
        maintenance.status = "Overdue";
        maintenance.penalty = calculatePenalty(
          MONTHLY_MAINTENANCE_AMOUNT,
          dueDate,
          currentDate
        );
        await maintenance.save();
        // console.log(`Updated maintenance to Overdue with penalty: ${maintenance.penalty}`);
      }
    }

    if (
      maintenance.status === "Paid" &&
      currentDate.getDate() >= NEW_RECORD_CREATION_DAY
    ) {
      const nextMonth = currentMonth + 1;
      const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
      const adjustedNextMonth = nextMonth > 11 ? 0 : nextMonth;

      const nextMaintenance = await Maintenance.findOne({
        ownerId: owner._id,
        dueDate: {
          $gte: new Date(nextYear, adjustedNextMonth, 1),
          $lt: new Date(nextYear, adjustedNextMonth + 1, 1),
        },
      });

      if (!nextMaintenance) {
        const newMaintenance = new Maintenance({
          ownerId: owner._id,
          societyName: owner.societyName,
          flatNumber: owner.flatNumber,
          amount: MONTHLY_MAINTENANCE_AMOUNT,
          dueDate: new Date(nextYear, adjustedNextMonth, 10),
          status: "Pending",
          penalty: 0,
          adminEmail: owner.adminEmail,
        });
        await newMaintenance.save();
        // console.log(`Created next month's maintenance record: ${newMaintenance._id}`);
      }
    }

    res.json({
      ownerName: owner.ownerName,
      societyName: owner.societyName,
      flatNumber: owner.flatNumber,
      email: owner.email,
      maintenance,
    });
  } catch (error) {
    console.error("GET /maintenance/:email error:", error.message);
    res
      .status(500)
      .json({ message: "Server error occurred", error: error.message });
  }
});

// POST maintenance payment (Used by owners)
router.post("/maintenance", async (req, res) => {
  try {
    const { email, paymentDate } = req.body;
    if (!email || !paymentDate) {
      return res
        .status(400)
        .json({ message: "Email and payment date are required" });
    }

    const owner = await FlatOwner.findOne({ email });
    if (!owner) {
      // console.log(`Owner not found for email: ${email}`);
      return res.status(404).json({ message: "Owner not found" });
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let maintenance = await Maintenance.findOne({
      ownerId: owner._id,
      dueDate: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1),
      },
      status: { $in: ["Pending", "Overdue"] },
    });

    if (!maintenance) {
      // console.log(`No pending/overdue maintenance record found for ${owner.email}. Creating new record.`);
      maintenance = new Maintenance({
        ownerId: owner._id,
        societyName: owner.societyName,
        flatNumber: owner.flatNumber,
        amount: MONTHLY_MAINTENANCE_AMOUNT,
        dueDate: new Date(currentYear, currentMonth, 10),
        status: "Pending",
        penalty: 0,
        adminEmail: owner.adminEmail,
      });
    }

    const dueDate = new Date(maintenance.dueDate);
    if (
      maintenance.status !== "Paid" &&
      (currentDate > dueDate ||
        (currentDate.getDate() > PENALTY_GRACE_DAY &&
          currentDate.getMonth() === dueDate.getMonth()))
    ) {
      maintenance.penalty = calculatePenalty(
        MONTHLY_MAINTENANCE_AMOUNT,
        dueDate,
        currentDate
      );
    }

    maintenance.paymentDate = new Date(paymentDate);
    maintenance.status = "Paid";
    maintenance.amount =
      MONTHLY_MAINTENANCE_AMOUNT + (maintenance.penalty || 0);
    await maintenance.save();
    // console.log(`Maintenance record marked as Paid: ${maintenance._id}`);

    if (currentDate.getDate() >= NEW_RECORD_CREATION_DAY) {
      const nextMonth = currentMonth + 1;
      const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
      const adjustedNextMonth = nextMonth > 11 ? 0 : nextMonth;

      const nextMaintenance = await Maintenance.findOne({
        ownerId: owner._id,
        dueDate: {
          $gte: new Date(nextYear, adjustedNextMonth, 1),
          $lt: new Date(nextYear, adjustedNextMonth + 1, 1),
        },
      });

      if (!nextMaintenance) {
        const newMaintenance = new Maintenance({
          ownerId: owner._id,
          societyName: owner.societyName,
          flatNumber: owner.flatNumber,
          amount: MONTHLY_MAINTENANCE_AMOUNT,
          dueDate: new Date(nextYear, adjustedNextMonth, 10),
          status: "Pending",
          penalty: 0,
          adminEmail: owner.adminEmail,
        });
        await newMaintenance.save();
        // console.log(`Created next month's maintenance record: ${newMaintenance._id}`);
      }
    }

    res.status(201).json(maintenance);
  } catch (error) {
    console.error("POST /maintenance error:", error.message);
    res
      .status(500)
      .json({ message: "Server error occurred", error: error.message });
  }
});

// GET maintenance payment history by email (Used by owners)
router.get("/history/:email", async (req, res) => {
  try {
    const owner = await FlatOwner.findOne({ email: req.params.email });
    if (!owner) {
      // console.log(`Owner not found for email: ${req.params.email}`);
      return res.status(404).json({ message: "Owner not found" });
    }

    const history = await Maintenance.find({ ownerId: owner._id }).sort({
      dueDate: -1,
    });
    // console.log(
    //   `Fetched ${history.length} history records for owner: ${owner.email}`
    // );
    res.json(history);
  } catch (error) {
    console.error("GET /history/:email error:", error.message);
    res
      .status(500)
      .json({ message: "Server error occurred", error: error.message });
  }
});

// GET total pending payments for a user (Used by owners)
router.get("/pending/:email", async (req, res) => {
  try {
    const owner = await FlatOwner.findOne({ email: req.params.email });
    if (!owner) {
      // console.log(`Owner not found for email: ${req.params.email}`);
      return res.status(404).json({ message: "Owner not found" });
    }

    const pendingPayments = await Maintenance.find({
      ownerId: owner._id,
      status: { $in: ["Pending", "Overdue"] },
    }).sort({ dueDate: 1 });

    const currentDate = new Date();
    const totalPending = pendingPayments.reduce((total, record) => {
      const dueDate = new Date(record.dueDate);
      const penalty = calculatePenalty(
        MONTHLY_MAINTENANCE_AMOUNT,
        dueDate,
        currentDate
      );
      record.penalty = penalty;
      record
        .save()
        .catch((err) => console.error("Error updating penalty:", err.message));
      return total + MONTHLY_MAINTENANCE_AMOUNT + penalty;
    }, 0);

    // console.log(`Fetched ${pendingPayments.length} pending payments for owner: ${owner.email}`);
    res.json({
      pendingPayments,
      totalPending,
      count: pendingPayments.length,
    });
  } catch (error) {
    console.error("GET /pending/:email error:", error.message);
    res
      .status(500)
      .json({ message: "Server error occurred", error: error.message });
  }
});

// GET all maintenance records for admin (Admin-only)
router.get("/admin/all", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail) {
      return res.status(400).json({ message: "Admin email is required" });
    }

    const admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      // console.log(`Admin not found for email: ${adminEmail}`);
      return res.status(404).json({ message: "Admin not found" });
    }

    let filter = {};
    if (admin.role !== "superadmin") {
      // Get societies assigned to the admin
      const societies = await Society.find({ adminEmail }, "name");
      const societyNames = societies.map((society) =>
        society.name.toLowerCase().trim()
      );
      if (societyNames.length === 0) {
        // console.log(`No societies found for admin: ${adminEmail}`);
        return res.status(200).json([]);
      }
      filter.societyName = { $in: societyNames };
      // console.log(`Filtering maintenance records for adminEmail: ${adminEmail}, societies: ${societyNames}`);
    } else {
      // console.log(`Fetching all maintenance records for superadmin: ${adminEmail}`);
    }

    const maintenanceRecords = await Maintenance.find(filter)
      .populate("ownerId", "ownerName email flatNumber societyName")
      .sort({ dueDate: -1 });

    // console.log(`Fetched ${maintenanceRecords.length} maintenance records for admin: ${adminEmail} (role: ${admin.role})`);
    if (maintenanceRecords.length === 0) {
      // console.log(`No records found. Filter used: ${JSON.stringify(filter)}`);
    }
    res.json(maintenanceRecords);
  } catch (error) {
    console.error("GET /admin/all error:", error.message);
    res
      .status(500)
      .json({ message: "Server error occurred", error: error.message });
  }
});

// PUT update a maintenance record by ID (Admin-only)
router.put("/:id", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail) {
      return res.status(400).json({ message: "Admin email is required" });
    }

    const admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      // console.log(`Admin not found for email: ${adminEmail}`);
      return res.status(404).json({ message: "Admin not found" });
    }

    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      // console.log(`Maintenance record not found for ID: ${req.params.id}`);
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    if (admin.role !== "superadmin") {
      // Verify the maintenance record belongs to a society assigned to the admin
      const society = await Society.findOne({
        name: maintenance.societyName,
        adminEmail,
      });
      if (!society) {
        // console.log(`Unauthorized attempt to edit record ${req.params.id} by ${adminEmail}`);
        return res
          .status(403)
          .json({ message: "Unauthorized to edit this record" });
      }
    }

    const { amount, penalty, status, paymentDate, dueDate } = req.body;
    if (amount !== undefined) maintenance.amount = amount;
    if (penalty !== undefined) maintenance.penalty = penalty;
    if (status) maintenance.status = status;
    if (paymentDate) maintenance.paymentDate = new Date(paymentDate);
    if (dueDate) maintenance.dueDate = new Date(dueDate);

    if (status === "Paid" && !maintenance.paymentDate) {
      maintenance.amount =
        MONTHLY_MAINTENANCE_AMOUNT + (maintenance.penalty || 0);
      maintenance.paymentDate = paymentDate
        ? new Date(paymentDate)
        : new Date();
    }

    await maintenance.save();
    // console.log(`Updated maintenance record: ${maintenance._id}`);
    res.json(maintenance);
  } catch (error) {
    console.error("PUT /:id error:", error.message);
    res
      .status(500)
      .json({ message: "Server error occurred", error: error.message });
  }
});

module.exports = router;
