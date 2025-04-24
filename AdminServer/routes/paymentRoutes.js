const express = require("express");
const router = express.Router();
const { calculatePenalty } = require("../services/penaltyService");
const Admin = require("../models/Admin"); // Import Admin model

let transactions = []; // Store mock transactions

// Simulated Payment Processor
const processPayment = async (amount) => {
  const transactionId = `TXN_${Math.floor(Math.random() * 1000000)}`;
  return {
    transactionId,
    amount,
    status: "Success",
    date: new Date().toISOString(),
  };
};

// Payment API with Auto Penalty Calculation
router.post("/pay", async (req, res) => {
  try {
    const { amount, dueDate, adminEmail } = req.body;
    if (!adminEmail) {
      return res.status(400).json({ error: "Admin email is required" });
    }

    // Validate admin existence
    const admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    if (!dueDate) {
      return res.status(400).json({ error: "Missing dueDate" });
    }

    // Calculate penalty based on due date and add it to the base amount
    const penalty = calculatePenalty(dueDate);
    const totalAmount = amount + penalty;

    // Process payment and add adminEmail to the transaction object
    let transaction = await processPayment(totalAmount);
    transaction.adminEmail = adminEmail;

    // Save the transaction in our mock storage
    transactions.push(transaction);

    res.status(200).json({
      ...transaction,
      penalty,
      totalAmountPaid: totalAmount,
    });
  } catch (error) {
    res.status(500).json({ error: "Payment processing failed." });
  }
});

// Get Late Payment Penalty API
router.post("/penalty", (req, res) => {
  try {
    const { dueDate } = req.body;
    if (!dueDate) {
      return res
        .status(400)
        .json({ error: "Please provide a valid due date." });
    }
    const penalty = calculatePenalty(dueDate);
    res.status(200).json({ penalty });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Error calculating penalty." });
  }
});

// Get Payment Transactions filtered by Admin Email.
router.get("/transactions", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail) {
      return res.status(400).json({ error: "Admin email is required" });
    }
    const admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    let filteredTransactions = transactions;
    if (admin.role !== "superadmin") {
      filteredTransactions = transactions.filter(
        (txn) => txn.adminEmail === adminEmail
      );
    }
    res.status(200).json(filteredTransactions);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch transactions." });
  }
});

// New Endpoint: Get Payment Count
router.get("/count", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail) {
      return res.status(400).json({ error: "Admin email is required" });
    }
    const admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    let filteredTransactions = transactions;
    if (admin.role !== "superadmin") {
      filteredTransactions = transactions.filter(
        (txn) => txn.adminEmail === adminEmail
      );
    }
    res.status(200).json({ count: filteredTransactions.length });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch payment count." });
  }
});

module.exports = router;
