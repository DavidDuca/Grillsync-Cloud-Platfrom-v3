"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Download, CheckCircle2 } from "lucide-react";

type Creds = {
  token: string;
  restaurant: { restaurantId: string; restaurantName: string };
  branch: { branchId: string; branchName: string; apiKey: string; apiSecret: string };
};

export default function SuccessPage() {
  const [c, setC] = useState<Creds | null>(null);
  useEffect(() => {
    const raw = sessionStorage.getItem("gs_credentials");
    if (raw) setC(JSON.parse(raw));
  }, []);

  if (!c) return <main className="p-10 text-muted">No credentials in session. <Link href="/register" className="text-brand">Register</Link></main>;

  const envText = `CLOUD_SYNC_URL=${process.env.NEXT_PUBLIC_APP_URL || ""}
CLOUD_SYNC_API_KEY=${c.branch.apiKey}
CLOUD_SYNC_SECRET=${c.branch.apiSecret}
CLOUD_RESTAURANT_ID=${c.restaurant.restaurantId}
CLOUD_BRANCH_ID=${c.branch.branchId}`;

  const copy = (s: string) => navigator.clipboard.writeText(s);
  const download = () => {
    const blob = new Blob([envText], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `grillsync-${c.branch.branchId}.env`;
    a.click();
  };

  return (
    <main className="min-h-screen gradient-hero">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="text-success" />
          <h1 className="text-3xl font-semibold">Restaurant created</h1>
        </div>
        <p className="mt-2 text-sm text-muted">Save these credentials now. <span className="text-brand">The API Secret will not be shown again.</span></p>

        <Row label="Restaurant ID" v={c.restaurant.restaurantId} onCopy={copy} />
        <Row label="Branch ID" v={c.branch.branchId} onCopy={copy} />
        <Row label="API Key" v={c.branch.apiKey} onCopy={copy} />
        <Row label="API Secret (shown once)" v={c.branch.apiSecret} onCopy={copy} danger />

        <div className="glass mt-6 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted">Sync configuration (.env)</h3>
            <div className="flex gap-2">
              <button onClick={() => copy(envText)} className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs hover:border-brand/60"><Copy className="inline h-3 w-3" /> Copy</button>
              <button onClick={download} className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-black"><Download className="inline h-3 w-3" /> Download</button>
            </div>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-md bg-bg p-4 text-xs text-text/90">{envText}</pre>
        </div>

        <Link href="/dashboard" className="mt-8 inline-block rounded-md bg-brand px-5 py-2.5 font-medium text-black shadow-glow">
          Go to dashboard →
        </Link>
      </div>
    </main>
  );
}

function Row({ label, v, onCopy, danger }: any) {
  return (
    <div className={`glass mt-4 flex items-center justify-between rounded-xl p-4 ${danger ? "border-brand/40" : ""}`}>
      <div>
        <div className="text-xs text-muted">{label}</div>
        <div className="mt-1 break-all font-mono text-sm">{v}</div>
      </div>
      <button onClick={() => onCopy(v)} className="ml-3 shrink-0 rounded-md border border-border bg-panel px-2 py-1 text-xs hover:border-brand/60">
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}
