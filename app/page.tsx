import Link from "next/link";
import { Flame, BarChart3, Building2, ShieldCheck } from "lucide-react";

export default function Landing() {
  return (
    <main className="gradient-hero min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Flame className="text-brand" />
          <span className="font-semibold tracking-tight">GrillSync <span className="text-brand">Cloud</span></span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-muted hover:text-text">Login</Link>
          <Link href="/register" className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-black hover:bg-brand/90">Register</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Multi-branch · Offline-first · Cloud analytics
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            One dashboard for every <span className="text-brand">branch</span> you run.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted md:text-lg">
            GrillSync Cloud aggregates sales, expenses, and operations from your locally hosted
            POS systems. Stable, simple, and built for owners who want answers — not infrastructure.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-md bg-brand px-5 py-2.5 font-medium text-black shadow-glow hover:bg-brand/90">
              Register Restaurant
            </Link>
            <Link href="/login" className="rounded-md border border-border bg-panel px-5 py-2.5 font-medium hover:border-brand/60">
              Login
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            { icon: Building2, t: "Branches in one view", d: "Compare revenue, profit, and orders across every location." },
            { icon: BarChart3, t: "Fast analytics", d: "Today / 7d / 30d / 90d with manual refresh. No realtime overhead." },
            { icon: ShieldCheck, t: "HMAC-signed uploads", d: "Each branch pushes data with API key + signed payloads." },
          ].map((f, i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <f.icon className="text-brand" />
              <h3 className="mt-4 font-medium">{f.t}</h3>
              <p className="mt-1 text-sm text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        © {new Date().getFullYear()} GrillSync Cloud
      </footer>
    </main>
  );
}
