import { useState } from "react";

const metadata = [
  { label: "ID", value: "VLT-8842" },
  { label: "Category", value: "FINANCE" },
  { label: "Size", value: "4.2 KB" },
];

export default function VaultDetail() {
  const [message, setMessage] = useState("");

  return (
    <div className="mt-6 grid h-[calc(100vh-150px)] grid-cols-[320px_1fr] gap-8">
      {/* Left sidebar */}
      <div className="flex flex-col gap-4 overflow-y-auto pr-2">
        {/* Active badge */}
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-sm border border-emerald bg-emerald/10 px-3 py-1.5 font-mono text-[11px] uppercase text-emerald">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-cv-pulse" />
          Context Active
        </div>

        {/* Vault metadata module */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
            <span className="text-[8px] text-primary">▼</span>
            Vault Metadata
          </div>
          <div className="rounded-b-lg border border-panel-border p-4">
            {metadata.map((m) => (
              <div key={m.label} className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                <span className="uppercase tracking-wide text-muted-foreground">{m.label}</span>
                <span className="min-w-[120px] rounded-sm border border-border bg-surface1 px-2 py-1 text-glow">
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cryptographic proof module */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
            <span className="text-[8px] text-primary">▼</span>
            Cryptographic Proof
          </div>
          <div className="rounded-b-lg border border-panel-border p-4 font-mono text-[10px] leading-relaxed text-muted-foreground">
            <p><span className="text-foreground">TX HASH:</span> 0x8f2a...9b4e</p>
            <p><span className="text-foreground">BLOCK:</span> 18,432,109</p>
            <p><span className="text-foreground">TIMESTAMP:</span> 2023-10-27T14:32:00Z</p>
            <p className="break-all"><span className="text-foreground">IPFS CID:</span> bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi</p>
          </div>
        </div>
      </div>

      {/* Right chat panel */}
      <div className="flex flex-col rounded-lg border border-panel-border bg-surface1">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-glow">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--glow))]" />
            FHE Context Pinned (Encrypted)
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">AGENT: 0X4A...B9C2</span>
        </div>

        {/* Chat messages */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {/* User message */}
          <div className="ml-auto max-w-[80%] rounded-lg border border-border bg-secondary p-4">
            Based on the confidential parameters in the vault, what is the risk assessment for Project Apollo?
          </div>

          {/* Agent message */}
          <div className="relative mr-auto max-w-[80%] rounded-lg border border-panel-border bg-primary/5 p-4">
            <div className="absolute -left-5 top-5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--glow))]" />
            <p className="mb-2 text-sm italic text-muted-foreground">Accessing encrypted context via FHE...</p>
            <p className="text-sm">
              Based on the provided constraints, Project Apollo carries a <strong>high risk</strong> profile primarily due to the timeline compression parameters specified in section 3 of the secure prompt. I cannot reveal those parameters, but the computation indicates a 78% probability of resource constraint.
            </p>
          </div>
        </div>

        {/* Chat input */}
        <div className="flex gap-3 border-t border-border p-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-sm border border-border bg-secondary px-4 py-3 text-foreground outline-none focus:border-primary"
          />
          <button className="inline-flex items-center gap-2 rounded-sm border border-primary bg-secondary px-4 py-2 font-mono text-xs uppercase text-glow transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
