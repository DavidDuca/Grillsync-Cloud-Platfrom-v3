"use client";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

export function Toolbar({
  range, setRange, branchId, setBranchId, branches, onRefresh, loading,
}: {
  range: string; setRange: (v: string) => void;
  branchId: string; setBranchId: (v: string) => void;
  branches: { branchId: string; branchName: string }[];
  onRefresh: () => void; loading?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded-md border border-border bg-panel2 px-3 py-2 text-sm">
        <option value="">All branches</option>
        {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
      </select>
      <div className="flex rounded-md border border-border bg-panel p-1">
        {[["today","Today"],["7d","7d"],["30d","30d"],["90d","90d"]].map(([k,l]) => (
          <button key={k} onClick={() => setRange(k)}
            className={cn("rounded px-3 py-1 text-xs", range === k ? "bg-brand text-black" : "text-muted hover:text-text")}>
            {l}
          </button>
        ))}
      </div>
      <button onClick={onRefresh} disabled={loading}
        className="ml-auto inline-flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-2 text-sm hover:border-brand/60">
        <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
      </button>
    </div>
  );
}
