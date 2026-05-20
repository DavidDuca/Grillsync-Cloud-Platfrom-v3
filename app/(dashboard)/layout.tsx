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

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  function logout() {
    localStorage.removeItem("gs_token");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-panel px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Flame className="text-brand h-4 w-4" />
          <span className="font-semibold">GrillSync</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="text-muted hover:text-text"
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>

      {/* mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="md:flex md:items-start">
        <aside
          className={cn(
            "border-r border-border bg-panel",
            // mobile: drawer
            "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 md:static md:transform-none",
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            // desktop: pinned full-height sidebar — fixes height changing per page
            "md:sticky md:top-0 md:z-auto md:h-screen md:w-60 md:shrink-0 md:translate-x-0",
            "flex flex-col overflow-y-auto"
          )}
        >
          <div className="hidden p-5 md:block">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Flame className="text-brand" />
              <span className="font-semibold tracking-tight">
                GrillSync <span className="text-brand">Cloud</span>
              </span>
            </Link>
            {me && (
              <div className="mt-4 break-words text-xs text-muted">
                {me.user?.name} · {me.restaurant?.restaurantName}
              </div>
            )}
          </div>

          {/* mobile-only header inside drawer */}
          <div className="flex items-center justify-between border-b border-border p-4 md:hidden">
            <span className="font-semibold">Menu</span>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="grid gap-1 p-3">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    active ? "bg-brand/10 text-brand" : "text-muted hover:bg-panel2 hover:text-text"
                  )}
                >
                  <Icon className="h-4 w-4" />{label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-text"
            >
              <LogOut className="h-4 w-4" />Logout
            </button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
