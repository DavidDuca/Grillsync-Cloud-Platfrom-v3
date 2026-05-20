"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import { AuthFooter } from "@/components/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({
    restaurantName: "", ownerName: "", email: "", password: "", phoneNumber: "",
    branchName: "", address: "", city: "", province: "",
  });
  const on = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  async function submit(e: any) {
    e.preventDefault(); setErr(null); setLoading(true);
    try {
      const { data } = await api.post("/auth/register", f);
      sessionStorage.setItem("gs_credentials", JSON.stringify(data));
      localStorage.setItem("gs_token", data.token);
      router.push("/register/success");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Registration failed");
    } finally { setLoading(false); }
  }

  return (
    <main className="flex min-h-screen flex-col gradient-hero">
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/" className="text-sm text-muted hover:text-text">&larr; Back</Link>
        <h1 className="mt-6 text-2xl font-semibold sm:text-3xl">Register your restaurant</h1>
        <p className="mt-2 text-sm text-muted">Creates owner account, first branch, and API credentials.</p>

        <form onSubmit={submit} className="mt-8 grid gap-5">
          <Section title="Restaurant">
            <Field label="Restaurant Name" value={f.restaurantName} onChange={on("restaurantName")} required />
            <Field label="Owner Name" value={f.ownerName} onChange={on("ownerName")} required />
            <Field label="Email" type="email" value={f.email} onChange={on("email")} required />
            <Field label="Password" type="password" value={f.password} onChange={on("password")} required minLength={8} />
            <Field label="Phone Number" value={f.phoneNumber} onChange={on("phoneNumber")} />
          </Section>
          <Section title="First Branch">
            <Field label="Branch Name" value={f.branchName} onChange={on("branchName")} required />
            <Field label="Address" value={f.address} onChange={on("address")} />
            <Field label="City" value={f.city} onChange={on("city")} />
            <Field label="Province" value={f.province} onChange={on("province")} />
          </Section>

          {err && <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{err}</div>}

          <button disabled={loading} className="rounded-md bg-brand px-4 py-2.5 font-medium text-black shadow-glow disabled:opacity-50">
            {loading ? "Creating..." : "Create restaurant"}
          </button>
        </form>
      </div>
      <AuthFooter />
    </main>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <h3 className="mb-3 text-sm font-medium text-muted">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}
function Field({ label, ...p }: any) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      <input {...p} className="w-full rounded-md border border-border bg-panel2 px-3 py-2 outline-none focus:border-brand" />
    </label>
  );
}
