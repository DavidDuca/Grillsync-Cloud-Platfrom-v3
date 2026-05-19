"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Flame, LayoutDashboard, Building2, ShoppingBag, Receipt, LogOut, Menu, X } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/branches", label: "Branches", icon: Building2 },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/expenses", label: "Expenses", icon: Receipt },
];

export default function DashLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    if (!localStorage.getItem("gs_token")) { router.replace("/login"); return; }
    api.get("/auth/me").then((r) => setMe(r.data)).catch(() => {});
  }, [router]);

  function logout() {
    localStorage.removeItem("gs_token");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-panel px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2"><Flame className="text-brand h-4 w-4" /><span className="font-semibold">GrillSync</span></Link>
        <button onClick={() => setOpen(!open)} className="text-muted">{open ? <X /> : <Menu />}</button>
      </header>

      <div className="md:flex">
        <aside className={cn("border-r border-border bg-panel md:block md:w-60 md:shrink-0", open ? "block" : "hidden")}>
          <div className="hidden p-5 md:block">
            <Link href="/dashboard" className="flex items-center gap-2"><Flame className="text-brand" /><span className="font-semibold tracking-tight">GrillSync <span className="text-brand">Cloud</span></span></Link>
            {me && <div className="mt-4 text-xs text-muted">{me.user?.name} · {me.restaurant?.restaurantName}</div>}
          </div>
          <nav className="grid gap-1 p-3">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm", active ? "bg-brand/10 text-brand" : "text-muted hover:bg-panel2 hover:text-text")}>
                  <Icon className="h-4 w-4" />{label}
                </Link>
              );
            })}
            <button onClick={logout} className="mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-text">
              <LogOut className="h-4 w-4" />Logout
            </button>
          </nav>
        </aside>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
