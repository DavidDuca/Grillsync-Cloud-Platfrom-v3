import Link from "next/link";

export function AuthFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-panel/40 px-4 py-5 text-center text-xs text-muted sm:px-6">
      <p>
        © {new Date().getFullYear()} GrillSync Cloud · Developed by{" "}
        <Link
          href="https://seedlynx.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline"
        >
          Seedlynx
        </Link>
      </p>
      <p className="mt-1 text-[11px] text-muted/80">
        Crafting reliable cloud platforms for modern businesses.
      </p>
    </footer>
  );
}
