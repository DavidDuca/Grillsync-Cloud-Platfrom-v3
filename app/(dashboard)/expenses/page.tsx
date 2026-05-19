"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Plus, RefreshCw, Trash2 } from "lucide-react";

const peso = (n: number) => "₱" + (n || 0).toLocaleString();
const CATS = ["Utilities","Supplies","Salary","Maintenance","Marketing","Other"];

export default function ExpensesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ description: "", amount: "", category: "Other", branchId: "", expenseDate: "", receiptImage: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get("/expenses", { params: { branchId } }); setItems(data.expenses || []); }
    finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => { api.get("/branches").then((r) => setBranches(r.data.branches || [])); }, []);
  useEffect(() => { load(); }, [load]);

  async function onFile(e: any) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const { data } = await api.post("/expenses/upload", { dataUrl: reader.result });
      setF((x) => ({ ...x, receiptImage: data.url || "" }));
    };
    reader.readAsDataURL(file);
  }

  async function save(e: any) {
    e.preventDefault();
    await api.post("/expenses", { ...f, amount: Number(f.amount) });
    setShow(false); setF({ description: "", amount: "", category: "Other", branchId: "", expenseDate: "", receiptImage: "" });
    load();
  }
  async function del(id: string) {
    if (!confirm("Delete this expense?")) return;
    await api.delete(`/expenses?id=${id}`); load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted">Affects profit analytics. Supports branch filtering.</p>
        </div>
        <div className="flex gap-2">
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded-md border border-border bg-panel2 px-3 py-2 text-sm">
            <option value="">All branches</option>
            {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
          </select>
          <button onClick={load} className="rounded-md border border-border bg-panel px-3 py-2 text-sm hover:border-brand/60">
            <RefreshCw className={`mr-1 inline h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
          </button>
          <button onClick={() => setShow(true)} className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-black shadow-glow">
            <Plus className="mr-1 inline h-3.5 w-3.5" />Add
          </button>
        </div>
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted">
            <tr>{["Description","Category","Branch","Amount","Date","Receipt",""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e._id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3">{e.description}</td>
                <td className="px-4 py-3 text-muted">{e.category}</td>
                <td className="px-4 py-3 text-muted">{branches.find((b) => b.branchId === e.branchId)?.branchName || "—"}</td>
                <td className="px-4 py-3 font-medium">{peso(e.amount)}</td>
                <td className="px-4 py-3 text-muted">{new Date(e.expenseDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">{e.receiptImage ? <a href={e.receiptImage} target="_blank" className="text-brand">View</a> : "—"}</td>
                <td className="px-4 py-3"><button onClick={() => del(e._id)} className="text-muted hover:text-danger"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No expenses.</td></tr>}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShow(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="glass grid w-full max-w-md gap-3 rounded-2xl p-5">
            <h3 className="text-base font-semibold">Add expense</h3>
            <input required placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
              className="rounded-md border border-border bg-panel2 px-3 py-2 outline-none focus:border-brand" />
            <input required type="number" step="0.01" placeholder="Amount" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })}
              className="rounded-md border border-border bg-panel2 px-3 py-2 outline-none focus:border-brand" />
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="rounded-md border border-border bg-panel2 px-3 py-2">
              {CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={f.branchId} onChange={(e) => setF({ ...f, branchId: e.target.value })} className="rounded-md border border-border bg-panel2 px-3 py-2">
              <option value="">Restaurant-wide</option>
              {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
            </select>
            <input type="datetime-local" value={f.expenseDate} onChange={(e) => setF({ ...f, expenseDate: e.target.value })}
              className="rounded-md border border-border bg-panel2 px-3 py-2" />
            <label className="text-xs text-muted">Receipt image
              <input type="file" accept="image/*" onChange={onFile} className="mt-1 block w-full text-xs" />
            </label>
            {f.receiptImage && <img src={f.receiptImage} className="h-24 w-24 rounded object-cover" />}
            <button className="rounded-md bg-brand px-4 py-2 font-medium text-black">Save</button>
          </form>
        </div>
      )}
    </div>
  );
}
