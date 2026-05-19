import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getAuth } from "@/lib/auth";
import { rangeWindow } from "@/lib/range";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const range = sp.get("range") || "today";
  const { start, end } = rangeWindow(range);
  const branchId = sp.get("branchId");
  await connectDB();
  const match: any = { restaurantId: a.restaurantId, paidAt: { $gte: start, $lte: end } };
  if (branchId) match.branchId = branchId;

  const bucket = range === "today"
    ? { $dateToString: { format: "%H:00", date: "$paidAt" } }
    : { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } };

  const rows = await Order.aggregate([
    { $match: match },
    { $group: { _id: bucket, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const points = rows.map((r) => ({ label: r._id, revenue: r.revenue, orders: r.orders }));
  return NextResponse.json({ points });
}
