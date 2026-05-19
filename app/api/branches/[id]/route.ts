import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Branch from "@/models/Branch";
import { getAuth } from "@/lib/auth";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();
  await connectDB();
  await Branch.updateOne(
    { branchId: id, restaurantId: a.restaurantId },
    { $set: { branchName: b.branchName, address: b.address, city: b.city, province: b.province, isActive: b.isActive } }
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDB();
  await Branch.deleteOne({ branchId: id, restaurantId: a.restaurantId });
  return NextResponse.json({ ok: true });
}
