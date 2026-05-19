import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Expense from "@/models/Expense";
import { getAuth } from "@/lib/auth";
import { rangeWindow } from "@/lib/range";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const { start, end } = rangeWindow(sp.get("range") || "today");
  const branchId = sp.get("branchId");
  await connectDB();
  const baseOrder: any = { restaurantId: a.restaurantId, paidAt: { $gte: start, $lte: end } };
  const baseExp:  any = { restaurantId: a.restaurantId, expenseDate: { $gte: start, $lte: end } };
  if (branchId) { baseOrder.branchId = branchId; baseExp.branchId = branchId; }

  const [agg, expAgg] = await Promise.all([
    Order.aggregate([{ $match: baseOrder }, { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } }]),
    Expense.aggregate([{ $match: baseExp }, { $group: { _id: null, expenses: { $sum: "$amount" } } }]),
  ]);
  const revenue  = agg[0]?.revenue || 0;
  const count    = agg[0]?.count   || 0;
  const expenses = expAgg[0]?.expenses || 0;
  return NextResponse.json({
    revenue, expenses,
    profit: revenue - expenses,
    ordersCount: count,
    avgTicket: count ? Math.round(revenue / count) : 0,
  });
}
