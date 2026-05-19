import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Branch from "@/models/Branch";
import { getAuth } from "@/lib/auth";
import { hashApiSecret, randHex } from "@/lib/crypto";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const branches = await Branch.find({ restaurantId: a.restaurantId })
    .select("-apiSecretHash").sort({ createdAt: 1 }).lean();
  return NextResponse.json({ branches });
}

export async function POST(req: NextRequest) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.branchName) return NextResponse.json({ error: "branchName required" }, { status: 400 });
  await connectDB();
  const branchId = "br_" + randHex(6);
  const apiKey = "rk_" + randHex(20);
  const apiSecret = "whsec_" + randHex(32);
  await Branch.create({
    branchId, restaurantId: a.restaurantId,
    branchName: b.branchName, address: b.address || "", city: b.city || "", province: b.province || "",
    apiKey, apiSecretHash: hashApiSecret(apiSecret), isActive: true,
  });
  return NextResponse.json({ branch: { branchId, branchName: b.branchName, apiKey, apiSecret } });
}
