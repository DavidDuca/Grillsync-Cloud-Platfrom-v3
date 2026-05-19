"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Copy, Plus, RefreshCw } from "lucide-react";

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [newCreds, setNewCreds] = useState<any>(null);
  const [f, setF] = useState({ branchName: "", address: "", city: "", province: "" });

  async function load() {
    setLoading(true);
    try { const { data } = await api.get("/branches"); setBranches(data.branches || []); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create(e: any) {
    e.preventDefault();
    const { data } = await api.post("/branches", f);
    setNewCreds(data); setShow(false); setF({ branchName: "", address: "", city: "", province: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Branches</h1>
          <p className="text-sm text-muted">One row per location with API credentials.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-md border border-border bg-panel px-3 py-2 text-sm hover:border-brand/60">
            <RefreshCw className={`mr-1 inline h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
          </button>
          <button onClick={() => setShow(true)} className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-black shadow-glow">
            <Plus className="mr-1 inline h-3.5 w-3.5" />Add branch
          </button>
        </div>
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted">
            <tr>{["Name","Address","Status","Last sync","Branch ID"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.branchId} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 font-medium">{b.branchName}</td>
                <td className="px-4 py-3 text-muted">{[b.address, b.city, b.province].filter(Boolean).join(", ") || "—"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${b.isActive ? "bg-success/20 text-success" : "bg-muted/20 text-muted"}`}>{b.isActive ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-3 text-muted">{b.lastSync ? new Date(b.lastSync).toLocaleString() : "Never"}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{b.branchId}</td>
              </tr>
            ))}
            {branches.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No branches yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {show && (
        <Modal onClose={() => setShow(false)} title="Add branch">
          <form onSubmit={create} className="grid gap-3">
            {["branchName","address","city","province"].map((k) => (
              <input key={k} required={k === "branchName"} placeholder={k} value={(f as any)[k]}
                onChange={(e) => setF({ ...f, [k]: e.target.value })}
                className="w-full rounded-md border border-border bg-panel2 px-3 py-2 outline-none focus:border-brand" />
            ))}
            <button className="rounded-md bg-brand px-4 py-2 font-medium text-black">Create</button>
          </form>
        </Modal>
      )}

      {newCreds && (
        <Modal onClose={() => setNewCreds(null)} title="Branch created — save credentials">
          <p className="mb-3 text-xs text-muted">API Secret is shown once.</p>
          {["branchId","apiKey","apiSecret"].map((k) => (
            <div key={k} className="mb-2 flex items-center justify-between rounded-md border border-border bg-panel2 p-3">
              <div>
                <div className="text-xs text-muted">{k}</div>
                <div className="break-all font-mono text-xs">{newCreds.branch[k]}</div>
              </div>
              <button onClick={() => navigator.clipboard.writeText(newCreds.branch[k])} className="rounded-md border border-border px-2 py-1 text-xs"><Copy className="h-3 w-3" /></button>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, title, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass w-full max-w-md rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-base font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  );
}
