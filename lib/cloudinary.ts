import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export async function uploadDataUrl(dataUrl: string, folder = "grillsync/receipts") {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return null;
  const r = await cloudinary.uploader.upload(dataUrl, { folder, resource_type: "image" });
  return r.secure_url;
}
