import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Branch from "@/models/Branch";
import { getAuth } from "@/lib/auth";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit = 25;
  const q = sp.get("q")?.trim();
  const branchId = sp.get("branchId");
  const from = sp.get("from"); const to = sp.get("to");

  const filter: any = { restaurantId: a.restaurantId };
  if (branchId) filter.branchId = branchId;
  if (q) filter.orderId = { $regex: q, $options: "i" };
  if (from || to) {
    filter.paidAt = {};
    if (from) filter.paidAt.$gte = new Date(from);
    if (to) filter.paidAt.$lte = new Date(new Date(to).getTime() + 86400000);
  }
  await connectDB();
  const [orders, total, branches] = await Promise.all([
    Order.find(filter).sort({ paidAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
    Branch.find({ restaurantId: a.restaurantId }).select("branchId branchName").lean(),
  ]);
  const bmap = Object.fromEntries(branches.map((b: any) => [b.branchId, b.branchName]));
  const withName = orders.map((o: any) => ({ ...o, branchName: bmap[o.branchId] }));
  return NextResponse.json({ orders: withName, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}
