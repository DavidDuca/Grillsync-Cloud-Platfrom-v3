"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: any) {
    e.preventDefault(); setErr(null); setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("gs_token", data.token);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen gradient-hero">
      <div className="mx-auto max-w-md px-6 py-20">
        <Link href="/" className="text-sm text-muted hover:text-text">&larr; Back</Link>
        <h1 className="mt-6 text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Sign in to your dashboard.</p>
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-border bg-panel2 px-3 py-2 outline-none focus:border-brand" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Password</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-border bg-panel2 px-3 py-2 outline-none focus:border-brand" />
          </label>
          {err && <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{err}</div>}
          <button disabled={loading} className="rounded-md bg-brand px-4 py-2.5 font-medium text-black shadow-glow disabled:opacity-50">
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <p className="text-center text-xs text-muted">No account? <Link href="/register" className="text-brand">Register</Link></p>
        </form>
      </div>
    </main>
  );
}
