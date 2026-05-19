"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Toolbar } from "@/components/dashboard/Toolbar";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend,
} from "recharts";

const peso = (n: number) => "₱" + (n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function Dashboard() {
  const [range, setRange] = useState("today");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [best, setBest] = useState<any[]>([]);
  const [perBranch, setPerBranch] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const q = `?range=${range}${branchId ? `&branchId=${branchId}` : ""}`;
    try {
      const [s, t, b, br] = await Promise.all([
        api.get("/analytics/summary" + q),
        api.get("/analytics/revenue-trend" + q),
        api.get("/analytics/best-sellers" + q),
        api.get("/analytics/branches" + `?range=${range}`),
      ]);
      setSummary(s.data); setTrend(t.data.points || []); setBest(b.data.items || []); setPerBranch(br.data.branches || []);
    } finally { setLoading(false); }
  }, [range, branchId]);

  useEffect(() => { api.get("/branches").then((r) => setBranches(r.data.branches || [])); }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted">Sales, profit and operations across your branches.</p>
        </div>
      </div>

      <Toolbar range={range} setRange={setRange} branchId={branchId} setBranchId={setBranchId}
        branches={branches} onRefresh={load} loading={loading} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Revenue" value={peso(summary?.revenue)} accent />
        <KpiCard label="Profit" value={peso(summary?.profit)} delta={`${peso(summary?.expenses)} expenses`} />
        <KpiCard label="Orders" value={(summary?.ordersCount ?? 0).toString()} />
        <KpiCard label="Avg ticket" value={peso(summary?.avgTicket || 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Revenue trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262c" />
              <XAxis dataKey="label" stroke="#8a8a93" fontSize={11} />
              <YAxis stroke="#8a8a93" fontSize={11} />
              <Tooltip contentStyle={{ background: "#111114", border: "1px solid #26262c", borderRadius: 8 }} />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Hourly revenue (today)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262c" />
              <XAxis dataKey="label" stroke="#8a8a93" fontSize={11} />
              <YAxis stroke="#8a8a93" fontSize={11} />
              <Tooltip contentStyle={{ background: "#111114", border: "1px solid #26262c", borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Best sellers">
          <ul className="divide-y divide-border">
            {best.length === 0 && <li className="py-6 text-center text-sm text-muted">No data yet.</li>}
            {best.map((b, i) => (
              <li key={b.name + i} className="flex items-center justify-between py-3 text-sm">
                <span><span className="mr-2 text-muted">#{i+1}</span>{b.name}</span>
                <span className="text-muted">{b.qty} sold · <span className="text-text">{peso(b.revenue)}</span></span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Branch comparison">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={perBranch}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262c" />
              <XAxis dataKey="branchName" stroke="#8a8a93" fontSize={11} />
              <YAxis stroke="#8a8a93" fontSize={11} />
              <Tooltip contentStyle={{ background: "#111114", border: "1px solid #26262c", borderRadius: 8 }} />
              <Legend wrapperStyle={{ color: "#8a8a93", fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="profit"  fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: any) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-3 text-sm font-medium text-muted">{title}</h3>
      {children}
    </div>
  );
}
