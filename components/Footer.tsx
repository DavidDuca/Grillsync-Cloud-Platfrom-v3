export function Footer() {
  return (
    <footer className="mt-10 border-t border-border/60 bg-panel/40 px-4 py-6 text-center text-xs text-muted">
      <p>
        &copy; {new Date().getFullYear()} GrillSync Cloud. Built by{" "}
        <a
          href="https://seedlynx.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline"
        >
          Seedlynx
        </a>
        .
      </p>
      <p className="mt-1">
        Visit{" "}
        <a
          href="https://seedlynx.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text"
        >
          seedlynx.vercel.app
        </a>{" "}
        for more.
      </p>
    </footer>
  );
}
