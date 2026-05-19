import { Schema, models, model } from "mongoose";
const RestaurantSchema = new Schema({
  restaurantId: { type: String, required: true, unique: true, index: true },
  restaurantName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String },
}, { timestamps: true });
export default models.Restaurant || model("Restaurant", RestaurantSchema);
