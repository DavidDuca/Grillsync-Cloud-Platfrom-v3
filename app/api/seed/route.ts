/**
 * POST /api/seed
 *
 * Dev convenience: creates a demo restaurant, branch, orders and expenses.
 * Guarded by SEED_TOKEN — set the env var and call with ?token=...
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Restaurant from "@/models/Restaurant";
import Branch from "@/models/Branch";
import Order from "@/models/Order";
import Expense from "@/models/Expense";
import { hashPassword, hashApiSecret, randHex } from "@/lib/crypto";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.SEED_TOKEN || token !== process.env.SEED_TOKEN)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  await Promise.all([
    User.deleteMany({ email: "demo@grillsync.app" }),
    Restaurant.deleteMany({ email: "demo@grillsync.app" }),
  ]);
  const restaurantId = "rest_demo";
  const branchA = "br_demo_a"; const branchB = "br_demo_b";
  await Promise.all([
    Branch.deleteMany({ restaurantId }),
    Order.deleteMany({ restaurantId }),
    Expense.deleteMany({ restaurantId }),
  ]);

  await Restaurant.create({ restaurantId, restaurantName: "Demo Grill House", ownerName: "Demo Owner", email: "demo@grillsync.app", phoneNumber: "" });
  await User.create({ name: "Demo Owner", email: "demo@grillsync.app", passwordHash: await hashPassword("demo1234"), role: "owner", restaurantId });
  for (const [id, name] of [[branchA, "Main Branch"], [branchB, "Mall Branch"]]) {
    const apiSecret = "whsec_" + randHex(32);
    await Branch.create({
      branchId: id, restaurantId, branchName: name,
      address: "Demo St.", city: "Calamba", province: "Laguna",
      apiKey: "rk_" + randHex(20), apiSecretHash: hashApiSecret(apiSecret),
      isActive: true, lastSync: new Date(),
    });
  }

  const menu = [
    { name: "Pork Liempo", price: 150 }, { name: "Chicken Inasal", price: 159 },
    { name: "Pork Sisig", price: 169 }, { name: "Iced Tea", price: 39 },
    { name: "Steamed Rice", price: 15 }, { name: "Bangus", price: 169 },
  ];
  const orders: any[] = [];
  const now = Date.now();
  for (let d = 0; d < 30; d++) {
    const day = new Date(now - d * 86400000);
    const ordersToday = 15 + Math.floor(Math.random() * 25);
    for (let i = 0; i < ordersToday; i++) {
      const branchId = Math.random() < 0.6 ? branchA : branchB;
      const items = Array.from({ length: 1 + Math.floor(Math.random() * 3) }).map(() => {
        const m = menu[Math.floor(Math.random() * menu.length)];
        const q = 1 + Math.floor(Math.random() * 2);
        return { itemId: m.name, name: m.name, category: "demo", basePrice: m.price, quantity: q, lineTotal: m.price * q };
      });
      const total = items.reduce((s, x) => s + x.lineTotal, 0);
      const paidAt = new Date(day); paidAt.setHours(10 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
      orders.push({
        restaurantId, branchId, orderId: `D${d}-${i}-${randHex(3)}`,
        items, total, paymentMethod: Math.random() < 0.8 ? "cash" : "card",
        status: "completed", paidAt, raw: { seed: true },
      });
    }
  }
  await Order.insertMany(orders);

  const expCats = ["Utilities", "Supplies", "Salary", "Maintenance"];
  await Expense.insertMany(Array.from({ length: 12 }).map((_, i) => ({
    restaurantId, branchId: i % 2 === 0 ? branchA : branchB,
    description: `${expCats[i % expCats.length]} bill`,
    amount: 500 + Math.floor(Math.random() * 5000),
    category: expCats[i % expCats.length],
    expenseDate: new Date(now - (i * 2) * 86400000),
  })));

  return NextResponse.json({ ok: true, login: { email: "demo@grillsync.app", password: "demo1234" }, orders: orders.length });
}
