import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import WalletButton from "@/components/WalletButton";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
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
    </div>
  );
}
