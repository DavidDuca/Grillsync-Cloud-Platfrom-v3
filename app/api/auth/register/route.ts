import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Restaurant from "@/models/Restaurant";
import Branch from "@/models/Branch";
import { hashPassword, hashApiSecret, randHex } from "@/lib/crypto";
import { signToken } from "@/lib/jwt";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const required = ["restaurantName","ownerName","email","password","branchName"];
    for (const k of required) if (!b[k]) return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });
    if (String(b.password).length < 8) return NextResponse.json({ error: "Password too short" }, { status: 400 });

    await connectDB();
    const exists = await User.findOne({ email: b.email.toLowerCase() });
    if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const restaurantId = "rest_" + randHex(7);
    const branchId = "br_" + randHex(6);
    const apiKey = "rk_" + randHex(20);
    const apiSecret = "whsec_" + randHex(32);

    const restaurant = await Restaurant.create({
      restaurantId,
      restaurantName: b.restaurantName,
      ownerName: b.ownerName,
      email: b.email.toLowerCase(),
      phoneNumber: b.phoneNumber || "",
    });
    const user = await User.create({
      name: b.ownerName,
      email: b.email.toLowerCase(),
      passwordHash: await hashPassword(b.password),
      role: "owner",
      restaurantId,
    });
    const branch = await Branch.create({
      branchId, restaurantId,
      branchName: b.branchName,
      address: b.address || "",
      city: b.city || "",
      province: b.province || "",
      apiKey, apiSecretHash: hashApiSecret(apiSecret),
      isActive: true,
    });

    const token = signToken({ userId: String(user._id), restaurantId, role: "owner" });
    return NextResponse.json({
      token,
      restaurant: { restaurantId, restaurantName: restaurant.restaurantName },
      branch: { branchId, branchName: branch.branchName, apiKey, apiSecret },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Register failed" }, { status: 500 });
  }
}
