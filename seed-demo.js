/**
 * seed-demo.js — GrillSync demo data seeder
 *
 * Creates ONE demo owner account + 5 branches + 90 days of orders & expenses.
 * Each branch has a distinct traffic/expense profile so dashboards show variety.
 *
 * Run from VS Code terminal at the project root (same folder as package.json):
 *
 *     node seed-demo.js --wipe         # clean previous demo + re-seed (recommended)
 *     node seed-demo.js                # additive
 *     node seed-demo.js --days=30      # custom range
 *
 * Requires MONGODB_URI in .env (or .env.local). Targets the SAME database your
 * production app uses, so make sure the URI in .env points to production.
 *
 * Dependencies already in your project: mongoose, bcryptjs, dotenv.
 *
 * Login credentials are printed at the end. email: demo@grillsync.app pw: Demo (atsymbol) Grill2026
 * 
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config(); // fallback to .env
const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// -------------------- CLI args --------------------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const DAYS = Number(args.days || 90);
const WIPE = !!args.wipe;
const SEED_TAG = "demo-v2";

// -------------------- Demo identity --------------------
const DEMO_EMAIL = "demo@grillsync.app";
const DEMO_PASSWORD = "Demo@Grill2026";
const DEMO_RESTAURANT = {
  restaurantId: "rest_demo_jonels",
  restaurantName: "JONEL'S INASALAN (Demo)",
  ownerName: "Jonel Dela Cruz",
  email: DEMO_EMAIL,
  phoneNumber: "+63-917-555-0100",
};

// -------------------- 5 branches w/ distinct profiles --------------------
// avgOrders = weekday baseline; weekendMult, growthMult, lunchHeavy, etc.
// shape per-branch traffic and menu price mix.
const DEMO_BRANCHES = [
  {
    branchId: "br_demo_calamba",
    branchName: "Calamba Main (Flagship)",
    address: "123 Rizal St.", city: "Calamba", province: "Laguna",
    profile: { avgOrders: 280, weekendMult: 1.25, growthMult: 1.00, lunchHeavy: false, ticketMult: 1.10, gcashShare: 0.30 },
  },
  {
    branchId: "br_demo_losbanos",
    branchName: "Los Baños (University)",
    address: "45 Lopez Ave.", city: "Los Baños", province: "Laguna",
    profile: { avgOrders: 230, weekendMult: 0.75, growthMult: 1.00, lunchHeavy: true,  ticketMult: 0.85, gcashShare: 0.45 },
  },
  {
    branchId: "br_demo_sanpablo",
    branchName: "San Pablo (Suburban)",
    address: "78 Colago Ave.", city: "San Pablo", province: "Laguna",
    profile: { avgOrders: 200, weekendMult: 1.10, growthMult: 1.00, lunchHeavy: false, ticketMult: 1.00, gcashShare: 0.20 },
  },
  {
    branchId: "br_demo_starosa",
    branchName: "Sta. Rosa (New / Growing)",
    address: "9 Balibago Rd.", city: "Sta. Rosa", province: "Laguna",
    // ramps from ~120/day to ~280/day over the period
    profile: { avgOrders: 200, weekendMult: 1.15, growthMult: 2.30, lunchHeavy: false, ticketMult: 1.05, gcashShare: 0.35 },
  },
  {
    branchId: "br_demo_tagaytay",
    branchName: "Tagaytay (Tourist / Weekend)",
    address: "11 Aguinaldo Hwy.", city: "Tagaytay", province: "Cavite",
    profile: { avgOrders: 180, weekendMult: 2.40, growthMult: 1.00, lunchHeavy: false, ticketMult: 1.35, gcashShare: 0.40 },
  },
];

// -------------------- Menu --------------------
const MENU = [
  { name: "Chicken Inasal Pecho",  price: 180, weight: 18, kind: "main" },
  { name: "Chicken Inasal Paa",    price: 160, weight: 22, kind: "main" },
  { name: "Pork BBQ (3 sticks)",   price: 120, weight: 15, kind: "main" },
  { name: "Sisig",                 price: 180, weight: 10, kind: "main" },
  { name: "Liempo",                price: 220, weight:  8, kind: "main" },
  { name: "Pancit Canton",         price: 150, weight:  6, kind: "main" },
  { name: "Lumpiang Shanghai",     price: 120, weight:  7, kind: "side" },
  { name: "Bulalo",                price: 350, weight:  3, kind: "main" },
  { name: "Garlic Rice",           price:  35, weight: 30, kind: "side" },
  { name: "Plain Rice",            price:  25, weight: 35, kind: "side" },
  { name: "Soft Drinks",           price:  40, weight: 28, kind: "drink" },
  { name: "Iced Tea",              price:  45, weight: 18, kind: "drink" },
  { name: "Halo-halo",             price:  90, weight:  6, kind: "dessert" },
];

const PAYMENT_BASE = [
  { method: "cash",  weight: 70 },
  { method: "gcash", weight: 22 },
  { method: "card",  weight:  8 },
];

// -------------------- helpers --------------------
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pickWeighted = (arr, weightKey = "weight") => {
  const total = arr.reduce((s, x) => s + x[weightKey], 0);
  let r = Math.random() * total;
  for (const x of arr) { r -= x[weightKey]; if (r <= 0) return x; }
  return arr[arr.length - 1];
};

function pickHour(lunchHeavy) {
  const buckets = lunchHeavy
    ? [{h:9,w:1},{h:10,w:3},{h:11,w:10},{h:12,w:22},{h:13,w:18},{h:14,w:8},{h:15,w:3},{h:16,w:2},{h:17,w:4},{h:18,w:10},{h:19,w:9},{h:20,w:6},{h:21,w:3},{h:22,w:1}]
    : [{h:9,w:1},{h:10,w:2},{h:11,w:5},{h:12,w:14},{h:13,w:11},{h:14,w:5},{h:15,w:3},{h:16,w:3},{h:17,w:5},{h:18,w:12},{h:19,w:15},{h:20,w:11},{h:21,w:6},{h:22,w:3}];
  return pickWeighted(buckets, "w").h;
}

function pickPayment(gcashShare) {
  const tweaked = [
    { method: "cash",  weight: Math.max(1, 70 - (gcashShare - 0.22) * 100) },
    { method: "gcash", weight: gcashShare * 100 },
    { method: "card",  weight: 8 },
  ];
  return pickWeighted(tweaked, "weight").method;
}

function buildOrder({ restaurantId, branchId, dayDate, seq, profile }) {
  const lineCount = randInt(1, 4);
  const chosen = [];
  for (let i = 0; i < lineCount; i++) {
    const m = pickWeighted(MENU);
    const existing = chosen.find((c) => c.name === m.name);
    if (existing) existing.qty += 1;
    else chosen.push({ name: m.name, price: m.price, qty: randInt(1, 2) });
  }
  let subtotal = chosen.reduce((s, l) => s + l.price * l.qty, 0);
  subtotal = Math.round(subtotal * profile.ticketMult);

  let discount = 0;
  if (Math.random() < 0.08) discount = Math.round(subtotal * (Math.random() < 0.5 ? 0.10 : 0.20));
  const total = Math.max(0, subtotal - discount);

  const voided = Math.random() < 0.02;
  const status = voided ? "void" : "paid";
  const paymentMethod = pickPayment(profile.gcashShare);

  const placedAt = new Date(dayDate);
  placedAt.setHours(pickHour(profile.lunchHeavy), randInt(0, 59), randInt(0, 59), 0);
  const paidAt = new Date(placedAt.getTime() + randInt(3, 25) * 60 * 1000);

  const dayKey = `${placedAt.getFullYear()}${String(placedAt.getMonth()+1).padStart(2,"0")}${String(placedAt.getDate()).padStart(2,"0")}`;
  const orderId = `${branchId}-${dayKey}-${String(seq).padStart(5,"0")}`;

  return {
    orderId, restaurantId, branchId,
    customerNo: seq,
    items: chosen, total, paymentMethod, status, placedAt, paidAt,
    raw: { seedTag: SEED_TAG, subtotal, discount, voided },
  };
}

// -------------------- Mongoose models (match /models/*.ts) --------------------
const Restaurant = mongoose.model("Restaurant", new mongoose.Schema({
  restaurantId: { type: String, required: true, unique: true, index: true },
  restaurantName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: String,
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
}, { timestamps: true, strict: false }));

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
}, { timestamps: true, strict: false }));

const User = mongoose.model("User", new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["owner", "manager", "staff"], default: "owner" },
  restaurantId: { type: String, required: true, index: true },
}, { timestamps: true }));

// -------------------- Expense generator --------------------
function buildExpensesForBranch(b, startDate) {
  const out = [];
  const restId = DEMO_RESTAURANT.restaurantId;
  const dailyRevenueGuess = b.profile.avgOrders * 220 * b.profile.ticketMult; // rough

  for (let d = 0; d < DAYS; d++) {
    const day = new Date(startDate); day.setDate(day.getDate() + d);
    const dow = day.getDay();
    const dom = day.getDate();

    // Daily ingredient/COGS (~30% of revenue, jitter)
    out.push({
      restaurantId: restId, branchId: b.branchId,
      description: "Daily market ingredients (chicken, pork, rice, charcoal)",
      amount: Math.round(dailyRevenueGuess * rand(0.27, 0.34)),
      category: "Ingredients",
      expenseDate: new Date(day.getTime() + 7 * 3600 * 1000),
      seedTag: SEED_TAG,
    });

    // Weekly supplies (every Monday)
    if (dow === 1) {
      out.push({
        restaurantId: restId, branchId: b.branchId,
        description: "Weekly supplies (napkins, take-out boxes, cleaning)",
        amount: randInt(2500, 6000),
        category: "Supplies",
        expenseDate: day, seedTag: SEED_TAG,
      });
    }

    // Bi-weekly payroll (1st & 16th)
    if (dom === 1 || dom === 16) {
      out.push({
        restaurantId: restId, branchId: b.branchId,
        description: "Staff payroll (15-day cutoff)",
        amount: Math.round(dailyRevenueGuess * rand(2.0, 2.6)),
        category: "Salaries",
        expenseDate: day, seedTag: SEED_TAG,
      });
    }

    // Monthly rent (5th)
    if (dom === 5) {
      out.push({
        restaurantId: restId, branchId: b.branchId,
        description: "Monthly rent",
        amount: randInt(35000, 80000),
        category: "Rent",
        expenseDate: day, seedTag: SEED_TAG,
      });
    }

    // Monthly utilities (10th)
    if (dom === 10) {
      out.push({
        restaurantId: restId, branchId: b.branchId,
        description: "Electricity, water, internet",
        amount: randInt(18000, 42000),
        category: "Utilities",
        expenseDate: day, seedTag: SEED_TAG,
      });
    }

    // Sporadic marketing / maintenance
    if (Math.random() < 0.04) {
      out.push({
        restaurantId: restId, branchId: b.branchId,
        description: Math.random() < 0.5 ? "Facebook boosted post" : "Tarpaulin / flyers",
        amount: randInt(800, 5000),
        category: "Marketing",
        expenseDate: day, seedTag: SEED_TAG,
      });
    }
    if (Math.random() < 0.03) {
      out.push({
        restaurantId: restId, branchId: b.branchId,
        description: "Equipment repair / maintenance",
        amount: randInt(1200, 9000),
        category: "Maintenance",
        expenseDate: day, seedTag: SEED_TAG,
      });
    }
  }
  return out;
}

// -------------------- Main --------------------
(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) { console.error("✗ MONGODB_URI not set in .env / .env.local"); process.exit(1); }

  console.log("→ Connecting to MongoDB…");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("✓ Connected.\n");

  const branchIds = DEMO_BRANCHES.map(b => b.branchId);

  if (WIPE) {
    console.log("→ Wiping previous demo data…");
    const [o, b, r, e, u] = await Promise.all([
      Order.deleteMany({ branchId: { $in: branchIds } }),
      Branch.deleteMany({ branchId: { $in: branchIds } }),
      Restaurant.deleteMany({ restaurantId: DEMO_RESTAURANT.restaurantId }),
      Expense.deleteMany({ restaurantId: DEMO_RESTAURANT.restaurantId }),
      User.deleteMany({ email: DEMO_EMAIL }),
    ]);
    console.log(`  orders:${o.deletedCount} branches:${b.deletedCount} rest:${r.deletedCount} exp:${e.deletedCount} users:${u.deletedCount}\n`);
  }

  // Restaurant
  await Restaurant.updateOne(
    { restaurantId: DEMO_RESTAURANT.restaurantId },
    { $set: { ...DEMO_RESTAURANT, seedTag: SEED_TAG } },
    { upsert: true }
  );
  console.log(`✓ Restaurant: ${DEMO_RESTAURANT.restaurantName}`);

  // Owner user (bcrypt — matches /api/auth/login)
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await User.updateOne(
    { email: DEMO_EMAIL },
    { $set: {
        name: DEMO_RESTAURANT.ownerName,
        email: DEMO_EMAIL,
        passwordHash,
        role: "owner",
        restaurantId: DEMO_RESTAURANT.restaurantId,
    }},
    { upsert: true }
  );
  console.log(`✓ Owner user: ${DEMO_EMAIL}`);

  // Branches
  const branchCreds = [];
  for (const b of DEMO_BRANCHES) {
    const apiKey = "rk_" + crypto.randomBytes(20).toString("hex");
    const apiSecret = "whsec_" + crypto.randomBytes(32).toString("hex");
    const apiSecretHash = crypto.createHash("sha256").update(apiSecret).digest("hex");
    await Branch.updateOne(
      { branchId: b.branchId },
      { $set: {
          branchId: b.branchId, restaurantId: DEMO_RESTAURANT.restaurantId,
          branchName: b.branchName,
          address: b.address, city: b.city, province: b.province,
          apiKey, apiSecretHash,
          isActive: true, lastSync: new Date(),
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

  console.log(`\n→ Generating orders for ${DAYS} days × ${DEMO_BRANCHES.length} branches…`);
  let totalInserted = 0;
  for (const b of DEMO_BRANCHES) {
    let branchInserted = 0;
    for (let d = 0; d < DAYS; d++) {
      const day = new Date(startDate); day.setDate(day.getDate() + d);
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;

      // growth ramp 0 → growthMult across DAYS
      const ramp = 1 + (b.profile.growthMult - 1) * (d / Math.max(1, DAYS - 1));
      const base = b.profile.avgOrders * ramp * (isWeekend ? b.profile.weekendMult : 1);
      // jitter + occasional bad/good day
      let jitter = rand(0.88, 1.12);
      if (Math.random() < 0.03) jitter *= rand(0.55, 0.75);   // slow day
      if (Math.random() < 0.03) jitter *= rand(1.25, 1.45);   // boom day
      const dailyCount = Math.max(60, Math.round(base * jitter));

      const batch = [];
      for (let i = 0; i < dailyCount; i++) {
        batch.push(buildOrder({
          restaurantId: DEMO_RESTAURANT.restaurantId,
          branchId: b.branchId,
          dayDate: day,
          seq: i + 1,
          profile: b.profile,
        }));
      }
      for (let i = 0; i < batch.length; i += 1000) {
        await Order.insertMany(batch.slice(i, i + 1000), { ordered: false })
          .catch(e => { if (e.code !== 11000) throw e; });
      }
      branchInserted += batch.length;
    }
    totalInserted += branchInserted;
    console.log(`  ✓ ${b.branchName}: ${branchInserted.toLocaleString()} orders`);
  }

  // Expenses
  console.log("\n→ Generating expenses…");
  let totalExp = 0;
  for (const b of DEMO_BRANCHES) {
    const docs = buildExpensesForBranch(b, startDate);
    for (let i = 0; i < docs.length; i += 1000) {
      await Expense.insertMany(docs.slice(i, i + 1000), { ordered: false });
    }
    totalExp += docs.length;
    console.log(`  ✓ ${b.branchName}: ${docs.length} expenses`);
  }

  // Summary
  console.log("\n=========================================================");
  console.log(` SEED COMPLETE`);
  console.log("=========================================================");
  console.log(` Orders:    ${totalInserted.toLocaleString()}`);
  console.log(` Expenses:  ${totalExp.toLocaleString()}`);
  console.log(` Days:      ${DAYS}`);
  console.log(` Branches:  ${DEMO_BRANCHES.length}`);
  console.log("\n LOGIN CREDENTIALS (for the web app)");
  console.log(" ---------------------------------------------------------");
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log("\n BRANCH API CREDENTIALS (POS sync — save now, secret hashed at rest)");
  console.log(" ---------------------------------------------------------");
  for (const b of branchCreds) {
    console.log(`\n   ${b.branchName}`);
    console.log(`     branchId : ${b.branchId}`);
    console.log(`     apiKey   : ${b.apiKey}`);
    console.log(`     apiSecret: ${b.apiSecret}`);
  }
  console.log("\n=========================================================\n");

  await mongoose.disconnect();
  process.exit(0);
})().catch(async (e) => {
  console.error("\n✗ Seed failed:", e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
