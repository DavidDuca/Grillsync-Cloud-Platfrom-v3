import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) console.warn("[mongo] MONGODB_URI not set");

// Cache across hot-reloads / serverless invocations (Vercel-safe).
let cached = (global as any).__mongoose as
  | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
  | undefined;
if (!cached) cached = (global as any).__mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached!.conn) return cached!.conn;
  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    });
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}
