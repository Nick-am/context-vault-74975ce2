import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import WalletButton from "@/components/WalletButton";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Marketplace", path: "/marketplace" },
  { label: "Create", path: "/create" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-[1400px] px-10">
          <nav className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3 font-sans text-lg font-bold tracking-tight">
              <div className="h-5 w-5 rounded-sm border border-glow bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
              ContextVault
            </Link>
            <div className="flex items-center gap-6">
              <div className="flex gap-6 font-mono text-xs uppercase">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "transition-colors hover:text-glow",
                      location.pathname === link.path ? "text-glow" : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <WalletButton />
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-10">{children}</main>
      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-[1400px] px-10 py-6 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <a
            href="https://www.linkedin.com/in/nicolas-ammann/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm border border-primary bg-primary/10 px-3 py-1.5 font-mono text-[11px] uppercase text-glow transition-all hover:bg-primary hover:text-white"
          >
            Get in Touch
          </a>
        </div>
      </footer>
    </div>
  );
}
