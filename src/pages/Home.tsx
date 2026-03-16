import { Link } from "react-router-dom";

const steps = [
  { num: "01 // INGEST", title: "Write Context", desc: "Define system behaviors, private knowledge bases, or sensitive instructions in plain text locally." },
  { num: "02 // ENCRYPT", title: "FHE Processing", desc: "Data is scrambled client-side. The ciphertext is mathematically functional but entirely unreadable." },
  { num: "03 // DEPLOY", title: "Granular Access", desc: "Store securely on-chain. Grant specific AI agent addresses computational access without decryption keys." },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="flex max-w-[800px] flex-col items-start pb-20 pt-32">
        <h1 className="mb-6 text-6xl font-bold leading-[1.1] tracking-tight">
          Secure AI Memory.{"\n"}Zero Knowledge.
        </h1>
        <p className="mb-10 max-w-[600px] text-xl text-muted-foreground">
          Encrypt system prompts using Fully Homomorphic Encryption. Grant AI agents access to context without ever revealing the underlying data.
        </p>
        <div className="flex gap-4">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/15 px-4 py-2 font-mono text-xs uppercase text-glow shadow-[0_0_10px_hsl(var(--primary)/0.1)] transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
          >
            Launch Vault
          </Link>
          <button className="inline-flex items-center gap-2 rounded-sm border border-primary bg-secondary px-4 py-2 font-mono text-xs uppercase text-glow transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
            Read Documentation
          </button>
        </div>
      </section>

      {/* Explainer */}
      <section className="mb-20 grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.num} className="rounded-lg border border-panel-border bg-surface1 p-6">
            <div className="mb-4 flex items-center gap-2 font-mono text-sm text-primary">
              <span className="block h-2 w-2 rounded-[1px] bg-primary" />
              {step.num}
            </div>
            <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </section>

      {/* Social proof */}
      <div className="mb-20 flex items-center gap-6 border-y border-border py-4 font-mono text-xs uppercase text-muted-foreground">
        <span className="text-glow">2,048</span> Vaults Secured
        <span className="text-muted-foreground">•</span>
        <span className="text-glow">14,592</span> Agent Accesses
        <span className="text-muted-foreground">•</span>
        <span className="text-glow">100%</span> FHE-Encrypted
      </div>
    </div>
  );
}
