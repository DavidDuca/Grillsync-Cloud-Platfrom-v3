import { cn } from "@/lib/cn";
export function KpiCard({ label, value, delta, accent }: { label: string; value: string; delta?: string; accent?: boolean }) {
  return (
    <div className={cn("glass rounded-2xl p-5", accent && "shadow-glow")}>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {delta && <div className="mt-1 text-xs text-muted">{delta}</div>}
    </div>
  );
}
