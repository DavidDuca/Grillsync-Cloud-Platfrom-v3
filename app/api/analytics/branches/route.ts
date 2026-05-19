import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Expense from "@/models/Expense";
import Branch from "@/models/Branch";
import { getAuth } from "@/lib/auth";
import { rangeWindow } from "@/lib/range";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { start, end } = rangeWindow(req.nextUrl.searchParams.get("range") || "today");
  await connectDB();

  const [rev, exp, branches] = await Promise.all([
    Order.aggregate([
      { $match: { restaurantId: a.restaurantId, paidAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$branchId", revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { restaurantId: a.restaurantId, expenseDate: { $gte: start, $lte: end } } },
      { $group: { _id: "$branchId", expenses: { $sum: "$amount" } } },
    ]),
    Branch.find({ restaurantId: a.restaurantId }).select("branchId branchName").lean(),
  ]);
  const revMap = Object.fromEntries(rev.map((r) => [r._id, r]));
  const expMap = Object.fromEntries(exp.map((r) => [r._id, r]));
  const out = branches.map((b: any) => {
    const r = revMap[b.branchId]?.revenue || 0;
    const e = expMap[b.branchId]?.expenses || 0;
    return { branchId: b.branchId, branchName: b.branchName, revenue: r, expenses: e, profit: r - e, orders: revMap[b.branchId]?.orders || 0 };
  });
  return NextResponse.json({ branches: out });
}
