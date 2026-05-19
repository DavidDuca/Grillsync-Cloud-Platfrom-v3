import { Schema, models, model } from "mongoose";
const OrderSchema = new Schema({
  orderId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  customerNo: Number,
  items: { type: Array, default: [] },
  total: { type: Number, required: true },
  paymentMethod: { type: String, default: "cash" },
  status: String,
  placedAt: Date,
  paidAt: Date,
  raw: Schema.Types.Mixed, // full POS payload (for traceability)
}, { timestamps: true });
OrderSchema.index({ branchId: 1, orderId: 1 }, { unique: true });
OrderSchema.index({ restaurantId: 1, paidAt: -1 });
export default models.Order || model("Order", OrderSchema);
