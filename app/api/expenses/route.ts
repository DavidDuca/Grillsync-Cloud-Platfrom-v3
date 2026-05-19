import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Expense from "@/models/Expense";
import { getAuth } from "@/lib/auth";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const branchId = req.nextUrl.searchParams.get("branchId");
  await connectDB();
  const f: any = { restaurantId: a.restaurantId };
  if (branchId) f.branchId = branchId;
  const expenses = await Expense.find(f).sort({ expenseDate: -1 }).limit(500).lean();
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.description || !b.amount) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  await connectDB();
  const e = await Expense.create({
    restaurantId: a.restaurantId,
    branchId: b.branchId || undefined,
    description: String(b.description).slice(0, 200),
    amount: Number(b.amount),
    category: b.category || "Other",
    receiptImage: b.receiptImage || undefined,
    expenseDate: b.expenseDate ? new Date(b.expenseDate) : new Date(),
  });
  return NextResponse.json({ expense: e });
}

export async function DELETE(req: NextRequest) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await connectDB();
  await Expense.deleteOne({ _id: id, restaurantId: a.restaurantId });
  return NextResponse.json({ ok: true });
}
