const mongoose = require("mongoose");

// Define the structure and validation rules for each expense document
const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      // Only allow these predefined category values
      enum: {
        values: ["Food", "Transport", "Shopping", "Health", "Entertainment", "Other"],
        message: "{VALUE} is not a valid category",
      },
    },

    date: {
      type: Date,
      required: [true, "Date is required"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps to each document
    timestamps: true,
  }
);

module.exports = mongoose.model("Expense", expenseSchema);