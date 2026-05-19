/**
 * POST /api/sync/batch
 *
 * Cloud ingestion endpoint matching the existing POS sync contract
 * (see local POS: server/sync/syncService.js).
 *
 * Headers:
 *   X-Api-Key        branch.apiKey
 *   X-Restaurant-Id  restaurant id (verified against the branch's restaurantId)
 *   X-Timestamp      ms-since-epoch (rejected if drift > 5 minutes)
 *   X-Signature      HMAC_SHA256( sha256(plainSecret), `${ts}.${rawBody}` )
 *
 * Body:
 *   { restaurantId, branchId, sentAt, records: [{id, entity, entityId, op, payload, createdAt}] }
 *
 * Response (200):
 *   { accepted: [{ id, cloudId }] }
 *
 * Idempotency:
 *   Orders are upserted on (branchId + orderId). Re-sending the same record is safe.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Branch from "@/models/Branch";
import Order from "@/models/Order";
import { verifyHmac } from "@/lib/crypto";
export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_SKEW_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  const apiKey   = req.headers.get("x-api-key") || "";
  const restHdr  = req.headers.get("x-restaurant-id") || "";
  const ts       = req.headers.get("x-timestamp") || "";
  const sig      = req.headers.get("x-signature") || "";
  if (!apiKey || !restHdr || !ts || !sig)
    return NextResponse.json({ error: "Missing auth headers" }, { status: 401 });

  const drift = Math.abs(Date.now() - Number(ts));
  if (!Number.isFinite(drift) || drift > MAX_SKEW_MS)
    return NextResponse.json({ error: "Stale timestamp" }, { status: 401 });

  const raw = await req.text();

  await connectDB();
  const branch = await Branch.findOne({ apiKey, restaurantId: restHdr, isActive: true });
  if (!branch) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = verifyHmac({
    storedSecretHash: branch.apiSecretHash,
    timestamp: ts, body: raw, signature: sig,
  });
  if (!ok) return NextResponse.json({ error: "Bad signature" }, { status: 401 });

  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const records: any[] = Array.isArray(body?.records) ? body.records : [];
  if (records.length === 0) return NextResponse.json({ accepted: [] });

  const accepted: { id: string; cloudId: string | null }[] = [];

  // Process records sequentially — batches are small (default 25) and this
  // keeps the code path simple and predictable on serverless.
  for (const r of records) {
    try {
      if (r.entity === "order" || r.entity === "sale") {
        const p = r.payload || {};
        const orderId = p.orderId || r.entityId;
        if (!orderId) continue;
        const items = Array.isArray(p.items) ? p.items : [];
        const total = Number(p.totalPrice ?? p.total ?? items.reduce((s: number, i: any) => s + Number(i.lineTotal || 0), 0));
        const upd: any = {
          restaurantId: branch.restaurantId,
          branchId: branch.branchId,
          orderId,
          total,
          paymentMethod: p.paymentMethod || "cash",
          status: p.status,
          customerNo: p.customerNo,
          items,
          placedAt: p.placedAt ? new Date(p.placedAt) : undefined,
          paidAt:   p.paidAt   ? new Date(p.paidAt)   : (p.placedAt ? new Date(p.placedAt) : new Date()),
          raw: p,
        };
        const res = await Order.findOneAndUpdate(
          { branchId: branch.branchId, orderId },
          { $set: upd }, { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        accepted.push({ id: r.id, cloudId: String(res?._id || "") });
      } else {
        // Unknown entity — accept as no-op so the POS doesn't park it.
        accepted.push({ id: r.id, cloudId: null });
      }
    } catch (err) {
      // Don't fail the whole batch — let other records through.
      console.error("[sync] record failed", r?.id, err);
    }
  }

  await Branch.updateOne({ _id: branch._id }, { $set: { lastSync: new Date() } });
  return NextResponse.json({ accepted });
}
