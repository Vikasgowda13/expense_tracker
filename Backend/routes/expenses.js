const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Expense = require("../models/Expense");

// ── GET all expenses ────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error("GET /expenses error:", error);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
});

// ── POST new expense ────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { title, amount, category, date, description } = req.body;

    if (!title || !amount || !category || !date) {
      return res.status(400).json({ message: "Title, amount, category, and date are required" });
    }

    const newExpense = new Expense({ title, amount, category, date, description });
    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);

  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    console.error("POST /expenses error:", error);
    res.status(500).json({ message: "Failed to add expense" });
  }
});

// ── PUT update expense ──────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(updatedExpense);

  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    console.error("PUT /expenses/:id error:", error);
    res.status(500).json({ message: "Failed to update expense" });
  }
});

// ── DELETE expense ──────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const deleted = await Expense.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });

  } catch (error) {
    console.error("DELETE /expenses/:id error:", error);
    res.status(500).json({ message: "Failed to delete expense" });
  }
});

module.exports = router;