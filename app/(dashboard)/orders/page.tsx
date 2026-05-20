"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { RefreshCw, Search } from "lucide-react";

const peso = (n: number) => "₱" + (n || 0).toLocaleString();

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [branchId, setBranchId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders", { params: { page, q, branchId, from, to } });
      setOrders(data.orders); setPages(data.pages);
    } finally { setLoading(false); }
  }, [page, q, branchId, from, to]);

  useEffect(() => { api.get("/branches").then((r) => setBranches(r.data.branches || [])); }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Orders</h1>
          <p className="text-sm text-muted">Synced from your POS systems.</p>
        </div>
        <button onClick={load} className="self-start rounded-md border border-border bg-panel px-3 py-2 text-sm hover:border-brand/60 sm:self-auto">
          <RefreshCw className={`mr-1 inline h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
        </button>
      </div>

      <div className="glass grid gap-3 rounded-2xl p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input placeholder="Search order ID" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }}
            className="w-full rounded-md border border-border bg-panel2 px-3 py-2 pl-9 text-sm outline-none focus:border-brand" />
        </div>
        <select value={branchId} onChange={(e) => { setPage(1); setBranchId(e.target.value); }}
          className="w-full rounded-md border border-border bg-panel2 px-3 py-2 text-sm">
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }}
          className="w-full rounded-md border border-border bg-panel2 px-3 py-2 text-sm" />
        <input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }}
          className="w-full rounded-md border border-border bg-panel2 px-3 py-2 text-sm" />
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-left text-muted">
            <tr>{["Order","Branch","Total","When"].map((h) => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 font-mono text-xs break-all">{o.orderId}</td>
                <td className="px-4 py-3 text-muted">{o.branchName || o.branchId}</td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">{peso(o.total)}</td>
                <td className="px-4 py-3 text-muted whitespace-nowrap">{o.paidAt ? new Date(o.paidAt).toLocaleString() : "—"}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">No orders.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-stretch gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted">Page {page} of {pages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="flex-1 rounded-md border border-border bg-panel px-3 py-1.5 disabled:opacity-40 sm:flex-none">Prev</button>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="flex-1 rounded-md border border-border bg-panel px-3 py-1.5 disabled:opacity-40 sm:flex-none">Next</button>
        </div>
      </div>
    </div>
  );
}
