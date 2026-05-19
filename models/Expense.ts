import { Schema, models, model } from "mongoose";
const ExpenseSchema = new Schema({
  restaurantId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: "Other" },
  receiptImage: String,
  expenseDate: { type: Date, default: Date.now, index: true },
}, { timestamps: true });
export default models.Expense || model("Expense", ExpenseSchema);
