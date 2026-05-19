/**
 * seed-demo.js — Seeds a demo restaurant with 3 branches and 90 days of orders
 * into the GrillSync cloud MongoDB.
 *
 * Usage:
 *   cd grillsync-cloud
 *   node seed-demo.js                # seeds with defaults
 *   node seed-demo.js --wipe         # removes any prior demo data first
 *   node seed-demo.js --days=30      # custom day range
 *   node seed-demo.js --orders=150   # orders per branch per day
 *
 * Reads MONGODB_URI from .env (or environment).
 *
 * All seeded docs are tagged with { seedTag: "demo-v1" } in `raw`/extra fields
 * so re-running with --wipe is safe and idempotent.
 */

require("dotenv").config();
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");

// -------- args --------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const DAYS = Number(args.days || 90);
const ORDERS_PER_DAY = Number(args.orders || 200);
const WIPE = !!args.wipe;
const SEED_TAG = "demo-v1";

// -------- mongoose models (matches /models/*.ts) --------
const Restaurant = mongoose.model("Restaurant", new mongoose.Schema({
  restaurantId: { type: String, required: true, unique: true, index: true },
  restaurantName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: String,
  branches: { type: [mongoose.Schema.Types.Mixed], default: [] },
  seedTag: String,
}, { timestamps: true, strict: false }));

const Branch = mongoose.model("Branch", new mongoose.Schema({
  branchId: { type: String, required: true, unique: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  branchName: { type: String, required: true },
  address: String, city: String, province: String,
  apiKey: { type: String, required: true, index: true },
  apiSecretHash: { type: String, required: true },
  lastSync: Date,
  isActive: { type: Boolean, default: true },
  seedTag: String,
}, { timestamps: true }));

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  customerNo: Number,
  items: { type: Array, default: [] },
  total: { type: Number, required: true },
  paymentMethod: { type: String, default: "cash" },
  status: String,
  placedAt: Date,
  paidAt: Date,
  raw: mongoose.Schema.Types.Mixed,
}, { timestamps: true });
OrderSchema.index({ branchId: 1, orderId: 1 }, { unique: true });
const Order = mongoose.model("Order", OrderSchema);

const Expense = mongoose.model("Expense", new mongoose.Schema({
  restaurantId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: "Other" },
  receiptImage: String,
  expenseDate: { type: Date, default: Date.now, index: true },
  seedTag: String,
}, { timestamps: true }));

// -------- demo data --------
const DEMO_RESTAURANT = {
  restaurantId: "rest_demo_jonels",
  restaurantName: "JONEL'S INASALAN (Demo)",
  ownerName: "Jonel Dela Cruz",
  email: "demo@jonels-inasalan.test",
  phoneNumber: "+63-917-555-0100",
};

const DEMO_BRANCHES = [
  { branchId: "br_demo_calamba",  branchName: "Calamba Main",  address: "123 Rizal St.",     city: "Calamba",    province: "Laguna" },
  { branchId: "br_demo_losbanos", branchName: "Los Baños",      address: "45 Lopez Ave.",     city: "Los Baños",  province: "Laguna" },
  { branchId: "br_demo_sanpablo", branchName: "San Pablo",      address: "78 Colago Ave.",    city: "San Pablo",  province: "Laguna" },
];

// Weighted menu (higher weight = more popular)
const MENU = [
  { name: "Chicken Inasal Pecho",   price: 180, weight: 18 },
  { name: "Chicken Inasal Paa",     price: 160, weight: 22 },
  { name: "Pork BBQ (3 sticks)",    price: 120, weight: 15 },
  { name: "Sisig",                  price: 180, weight: 10 },
  { name: "Liempo",                 price: 220, weight: 8  },
  { name: "Pancit Canton",          price: 150, weight: 6  },
  { name: "Lumpiang Shanghai",      price: 120, weight: 7  },
  { name: "Bulalo",                 price: 350, weight: 3  },
  { name: "Garlic Rice",            price: 35,  weight: 30 },
  { name: "Plain Rice",             price: 25,  weight: 35 },
  { name: "Soft Drinks",            price: 40,  weight: 28 },
  { name: "Iced Tea",               price: 45,  weight: 18 },
  { name: "Halo-halo",              price: 90,  weight: 6  },
];

const PAYMENT_METHODS = [
  { method: "cash",  weight: 70 },
  { method: "gcash", weight: 22 },
  { method: "card",  weight: 8  },
];

// -------- helpers --------
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pickWeighted = (arr, weightKey = "weight") => {
  const total = arr.reduce((s, x) => s + x[weightKey], 0);
  let r = Math.random() * total;
  for (const x of arr) { r -= x[weightKey]; if (r <= 0) return x; }
  return arr[arr.length - 1];
};

// hours-of-day distribution: lunch + dinner peaks
function pickHour() {
  const buckets = [
    { h:  9, w: 1 }, { h: 10, w: 2 }, { h: 11, w: 5 },
    { h: 12, w: 14 }, { h: 13, w: 11 }, { h: 14, w: 5 },
    { h: 15, w: 3 }, { h: 16, w: 3 }, { h: 17, w: 5 },
    { h: 18, w: 12 }, { h: 19, w: 15 }, { h: 20, w: 11 },
    { h: 21, w: 6 }, { h: 22, w: 3 },
  ];
  return pickWeighted(buckets, "w").h;
}

function buildOrder({ restaurantId, branchId, dayDate, seq }) {
  // items: 1-4 mains-ish + usually rice + sometimes drink
  const lineCount = randInt(1, 4);
  const chosen = [];
  for (let i = 0; i < lineCount; i++) {
    const m = pickWeighted(MENU);
    const existing = chosen.find((c) => c.name === m.name);
    if (existing) existing.qty += 1;
    else chosen.push({ name: m.name, price: m.price, qty: randInt(1, 2) });
  }
  let subtotal = chosen.reduce((s, l) => s + l.price * l.qty, 0);

  // ~8% discount
  let discount = 0;
  if (Math.random() < 0.08) discount = Math.round(subtotal * (Math.random() < 0.5 ? 0.1 : 0.2));

  // ~3% void
  const voided = Math.random() < 0.03;
  const status = voided ? "voided" : "paid";

  const total = Math.max(0, subtotal - discount);
  const paymentMethod = pickWeighted(PAYMENT_METHODS, "weight").method;

  const hour = pickHour();
  const placedAt = new Date(dayDate);
  placedAt.setHours(hour, randInt(0, 59), randInt(0, 59), 0);
  const paidAt = voided ? null : new Date(placedAt.getTime() + randInt(3, 25) * 60000);

  const orderId = `${branchId}-${placedAt.toISOString().slice(0,10).replace(/-/g,"")}-${String(seq).padStart(4,"0")}`;

  return {
    orderId,
    restaurantId,
    branchId,
    customerNo: seq,
    items: chosen,
    total,
    paymentMethod,
    status,
    placedAt,
    paidAt,
    raw: { seedTag: SEED_TAG, subtotal, discount, voided },
  };
}

// -------- main --------
(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) { console.error("MONGODB_URI not set"); process.exit(1); }

  console.log("Connecting to MongoDB…");
  await mongoose.connect(uri);
  console.log("Connected.");

  if (WIPE) {
    console.log("Wiping previous demo data…");
    const branchIds = DEMO_BRANCHES.map(b => b.branchId);
    const [r1, r2, r3, r4] = await Promise.all([
      Order.deleteMany({ branchId: { $in: branchIds } }),
      Branch.deleteMany({ branchId: { $in: branchIds } }),
      Restaurant.deleteMany({ restaurantId: DEMO_RESTAURANT.restaurantId }),
      Expense.deleteMany({ seedTag: SEED_TAG }),
    ]);
    console.log(`  Orders: ${r1.deletedCount}, Branches: ${r2.deletedCount}, Restaurants: ${r3.deletedCount}, Expenses: ${r4.deletedCount}`);
  }

  // Restaurant (embed branches[] to satisfy unique index on branches.branchId)
  const embeddedBranches = DEMO_BRANCHES.map(b => ({
    branchId: b.branchId,
    branchName: b.branchName,
    address: b.address,
    city: b.city,
    province: b.province,
    isActive: true,
  }));
  await Restaurant.updateOne(
    { restaurantId: DEMO_RESTAURANT.restaurantId },
    { $set: { ...DEMO_RESTAURANT, branches: embeddedBranches, seedTag: SEED_TAG } },
    { upsert: true }
  );
  console.log(`✓ Restaurant: ${DEMO_RESTAURANT.restaurantName}`);

  // Branches (generate apiKey + secret, store sha256(secret))
  const branchCreds = [];
  for (const b of DEMO_BRANCHES) {
    const apiKey = "rk_" + crypto.randomBytes(20).toString("hex");
    const apiSecret = "whsec_" + crypto.randomBytes(32).toString("hex");
    const apiSecretHash = crypto.createHash("sha256").update(apiSecret).digest("hex");
    await Branch.updateOne(
      { branchId: b.branchId },
      { $set: {
          ...b,
          restaurantId: DEMO_RESTAURANT.restaurantId,
          apiKey, apiSecretHash,
          isActive: true,
          seedTag: SEED_TAG,
      }},
      { upsert: true }
    );
    branchCreds.push({ ...b, apiKey, apiSecret });
    console.log(`✓ Branch: ${b.branchName}`);
  }

  // Orders
  const startDate = new Date(); startDate.setHours(0,0,0,0);
  startDate.setDate(startDate.getDate() - DAYS + 1);

  const totalTarget = DEMO_BRANCHES.length * DAYS * ORDERS_PER_DAY;
  console.log(`Generating ~${totalTarget.toLocaleString()} orders (${DAYS} days × ${ORDERS_PER_DAY}/day × ${DEMO_BRANCHES.length} branches)…`);

  let inserted = 0;
  for (const b of DEMO_BRANCHES) {
    for (let d = 0; d < DAYS; d++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + d);
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const dailyCount = Math.round(ORDERS_PER_DAY * (isWeekend ? 1.25 : 1.0) * rand(0.9, 1.1));

      const batch = [];
      for (let i = 0; i < dailyCount; i++) {
        batch.push(buildOrder({
          restaurantId: DEMO_RESTAURANT.restaurantId,
          branchId: b.branchId,
          dayDate: day,
          seq: i + 1,
        }));
      }
      // bulk insert in chunks of 1000
      for (let i = 0; i < batch.length; i += 1000) {
        await Order.insertMany(batch.slice(i, i + 1000), { ordered: false }).catch(e => {
          if (e.code !== 11000) throw e; // ignore dup-key from re-runs
        });
      }
      inserted += batch.length;
    }
    console.log(`  ${b.branchName}: ${inserted.toLocaleString()} total so far`);
  }

  // A few expenses per branch per month for dashboards
  console.log("Seeding expenses…");
  const expenseCategories = ["Utilities","Supplies","Salaries","Marketing","Maintenance","Ingredients"];
  const expenses = [];
  for (const b of DEMO_BRANCHES) {
    for (let d = 0; d < DAYS; d += 7) {
      const day = new Date(startDate); day.setDate(day.getDate() + d);
      expenses.push({
        restaurantId: DEMO_RESTAURANT.restaurantId,
        branchId: b.branchId,
        description: `Weekly ${expenseCategories[d % expenseCategories.length].toLowerCase()} restock`,
        amount: randInt(1500, 9000),
        category: expenseCategories[d % expenseCategories.length],
        expenseDate: day,
        seedTag: SEED_TAG,
      });
    }
  }
  await Expense.insertMany(expenses);

  // Update branch lastSync
  await Branch.updateMany(
    { branchId: { $in: DEMO_BRANCHES.map(b=>b.branchId) } },
    { $set: { lastSync: new Date() } }
  );

  console.log("\n=========================================");
  console.log(`✓ Done. ${inserted.toLocaleString()} orders, ${expenses.length} expenses.`);
  console.log("=========================================\n");
  console.log("Branch credentials (save these if you want POS clients to sync):");
  for (const b of branchCreds) {
    console.log(`\n  ${b.branchName}`);
    console.log(`    branchId:  ${b.branchId}`);
    console.log(`    apiKey:    ${b.apiKey}`);
    console.log(`    apiSecret: ${b.apiSecret}   (shown once)`);
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch(async (e) => {
  console.error("Seed failed:", e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
