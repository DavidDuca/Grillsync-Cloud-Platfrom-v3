/**
 * POST /api/sync/upload
 *
 * Simpler alias of /api/sync/batch using plain x-api-key + x-api-secret headers.
 * Intended for future POS clients that don't sign requests. The primary path
 * is /api/sync/batch (HMAC), which is what the current Jonel's POS uses.
 *
 * Body:
 *   { restaurantId, branchId, orders: [...], salesSummary?: {...}, uploadedAt: "..." }
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Branch from "@/models/Branch";
import Order from "@/models/Order";
import { sha256 } from "@/lib/crypto";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key") || "";
  const secret = req.headers.get("x-api-secret") || "";
  if (!apiKey || !secret) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });

  await connectDB();
  const branch = await Branch.findOne({ apiKey, isActive: true });
  if (!branch || branch.apiSecretHash !== sha256(secret))
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.restaurantId && body.restaurantId !== branch.restaurantId)
    return NextResponse.json({ error: "restaurantId mismatch" }, { status: 400 });

  const orders: any[] = Array.isArray(body.orders) ? body.orders : [];
  let upserts = 0;
  for (const o of orders) {
    const orderId = o.orderId || o.id; if (!orderId) continue;
    const items = Array.isArray(o.items) ? o.items : [];
    const total = Number(o.total ?? o.totalPrice ?? items.reduce((s: number, i: any) => s + Number(i.lineTotal || 0), 0));
    await Order.findOneAndUpdate(
      { branchId: branch.branchId, orderId },
      { $set: {
          restaurantId: branch.restaurantId, branchId: branch.branchId, orderId,
          total, paymentMethod: o.paymentMethod || "cash", status: o.status,
          customerNo: o.customerNo, items,
          placedAt: o.placedAt ? new Date(o.placedAt) : undefined,
          paidAt: o.paidAt ? new Date(o.paidAt) : new Date(),
          raw: o,
        } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    upserts++;
  }
  await Branch.updateOne({ _id: branch._id }, { $set: { lastSync: new Date() } });
  return NextResponse.json({ ok: true, upserts });
}
