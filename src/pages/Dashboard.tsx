import { useNavigate } from "react-router-dom";

const stats = [
  { label: "Total Vaults", value: "142" },
  { label: "Total Accesses", value: "8,093" },
  { label: "Unique Agents", value: "47" },
];

const vaults = [
  { title: "Trading Algo V2", category: "Finance", creator: "0x88...3A19", agents: "3 AGENTS", active: true },
  { title: "Legal Boilerplate Setup", category: "Legal", creator: "0x2F...99B1", agents: "1 AGENT", active: true },
  { title: "NPC Dialogue Rules", category: "Gaming", creator: "0x7C...44D0", agents: "12 AGENTS", active: false },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="py-8">
      {/* Section header */}
      <div className="mb-2 flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
        <span className="text-[8px] text-primary">▼</span>
        System Overview
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-2 rounded-lg border border-border bg-surface1 p-5">
            <span className="font-mono text-[11px] uppercase text-muted-foreground">{s.label}</span>
            <span className="font-mono text-[32px] font-bold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Active deployments header */}
      <div className="mb-2 flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
        <span className="text-[8px] text-primary">▼</span>
        Active Deployments
      </div>

      {/* Vault grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vaults.map((v) => (
          <div
            key={v.title}
            onClick={() => navigate("/vault/1")}
            className="cursor-pointer rounded-lg border border-border bg-surface1 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-glow hover:shadow-[0_4px_20px_hsl(var(--primary)/0.1)]"
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold">{v.title}</h3>
              <span className="rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[9px] uppercase">
                {v.category}
              </span>
            </div>
            <div className="flex flex-col gap-2 font-mono text-[11px] text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>CREATOR</span>
                <span>{v.creator}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>GRANTED</span>
                <span>{v.agents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>STATUS</span>
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    v.active
                      ? "bg-emerald shadow-[0_0_6px_hsl(var(--emerald))]"
                      : "bg-muted-foreground"
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
