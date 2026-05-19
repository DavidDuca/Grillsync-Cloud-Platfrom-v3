import mongoose, { Schema, models, model } from "mongoose";
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["owner", "manager", "staff"], default: "owner" },
  restaurantId: { type: String, required: true, index: true },
}, { timestamps: true });
export default models.User || model("User", UserSchema);
