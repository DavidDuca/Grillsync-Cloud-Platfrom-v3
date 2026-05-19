import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getAuth } from "@/lib/auth";
import { rangeWindow } from "@/lib/range";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const { start, end } = rangeWindow(sp.get("range") || "today");
  const branchId = sp.get("branchId");
  await connectDB();
  const match: any = { restaurantId: a.restaurantId, paidAt: { $gte: start, $lte: end } };
  if (branchId) match.branchId = branchId;
  const rows = await Order.aggregate([
    { $match: match },
    { $unwind: "$items" },
    { $group: {
        _id: "$items.name",
        qty: { $sum: { $ifNull: ["$items.quantity", 1] } },
        revenue: { $sum: { $ifNull: ["$items.lineTotal", 0] } },
    }},
    { $sort: { qty: -1 } }, { $limit: 10 },
  ]);
  return NextResponse.json({ items: rows.map((r) => ({ name: r._id, qty: r.qty, revenue: r.revenue })) });
}
