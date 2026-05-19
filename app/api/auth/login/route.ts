import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyPassword } from "@/lib/crypto";
import { signToken } from "@/lib/jwt";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  await connectDB();
  const u = await User.findOne({ email: String(email).toLowerCase() });
  if (!u || !(await verifyPassword(password, u.passwordHash)))
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  const token = signToken({ userId: String(u._id), restaurantId: u.restaurantId, role: u.role });
  return NextResponse.json({ token, user: { name: u.name, email: u.email, role: u.role, restaurantId: u.restaurantId } });
}
