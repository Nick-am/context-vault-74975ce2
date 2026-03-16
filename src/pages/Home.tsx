import { Link } from "react-router-dom";

const steps = [
  { num: "01 // ENCRYPT", title: "Encrypt", desc: "Write your prompt. We encrypt it with FHE — mathematically unreadable to everyone." },
  { num: "02 // LIST", title: "List", desc: "Set your price. Per query, subscription, or one-time. You control the model." },
  { num: "03 // EARN", title: "Earn", desc: "Buyers pay, get auto-whitelisted, and access your AI. You keep the IP. We take 10%." },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="flex max-w-[800px] flex-col items-start pb-20 pt-32">
        <h1 className="mb-6 text-6xl font-bold leading-[1.1] tracking-tight">
          Spotify for AI Prompts.
        </h1>
        <p className="mb-10 max-w-[600px] text-xl text-muted-foreground">
          Encrypt your system prompt onchain. Set a price. Buyers access the intelligence — never the source.
        </p>
        <div className="flex gap-4">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary px-4 py-2 font-mono text-xs uppercase text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.2)] transition-all hover:bg-primary/90 hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
          >
            Create a Vault
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-sm border border-primary bg-transparent px-4 py-2 font-mono text-xs uppercase text-glow transition-all hover:bg-primary/10"
          >
            Access a Vault
          </Link>
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
