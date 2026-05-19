import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Restaurant from "@/models/Restaurant";
import { getAuth } from "@/lib/auth";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const [user, restaurant] = await Promise.all([
    User.findById(a.userId).lean(),
    Restaurant.findOne({ restaurantId: a.restaurantId }).lean(),
  ]);
  return NextResponse.json({ user, restaurant });
}
