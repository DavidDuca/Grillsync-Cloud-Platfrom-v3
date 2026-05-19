import { Schema, models, model } from "mongoose";
const BranchSchema = new Schema({
  branchId: { type: String, required: true, unique: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  branchName: { type: String, required: true },
  address: String,
  city: String,
  province: String,
  apiKey: { type: String, required: true, index: true },
  apiSecretHash: { type: String, required: true }, // sha256(plainSecret) hex — used as HMAC key
  lastSync: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
export default models.Branch || model("Branch", BranchSchema);
