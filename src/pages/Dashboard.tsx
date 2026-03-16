import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { getCreatorEntries, getEntry, getEntryCount, type VaultEntry } from "../lib/contract";

interface VaultRow {
  id: number;
  entry: VaultEntry;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { address, isConnected } = useWallet();
  const [vaults, setVaults] = useState<VaultRow[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getEntryCount().then(setTotalCount).catch(() => {});
  }, []);

  useEffect(() => {
    if (!address) {
      setVaults([]);
      return;
    }
    setLoading(true);
    getCreatorEntries(address)
      .then(async (ids) => {
        const rows = await Promise.all(
          ids.map(async (id) => {
            const entry = await getEntry(id);
            return { id, entry };
          })
        );
        setVaults(rows);
      })
      .catch(() => setVaults([]))
      .finally(() => setLoading(false));
  }, [address]);

  const stats = [
    { label: "Total Vaults (On-Chain)", value: totalCount !== null ? String(totalCount) : "..." },
    { label: "Your Vaults", value: String(vaults.length) },
    { label: "Network", value: "Sepolia" },
  ];

  function truncateAddr(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  return (
    <div className="py-8">
      {/* Section header */}
      <div className="mb-2 flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
        <span className="text-[8px] text-primary">▼</span>
        Marketplace Overview
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

      {/* Featured Vaults */}
      <div className="mb-2 flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
        <span className="text-[8px] text-primary">▼</span>
        Featured Vaults
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Fake demo vault */}
        <div
          onClick={() => navigate("/vault/demo")}
          className="cursor-pointer rounded-lg border border-border bg-surface1 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-glow hover:shadow-[0_4px_20px_hsl(var(--primary)/0.1)]"
        >
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-lg font-semibold">Equity Analyst</h3>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald shadow-[0_0_6px_hsl(var(--emerald))]" />
          </div>
          <div className="flex flex-col gap-2 font-mono text-[11px] text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>CREATOR</span>
              <span>0x1a2B...9f4E</span>
            </div>
            <div className="flex items-center justify-between">
              <span>PRICE</span>
              <span>0.01 ETH / query</span>
            </div>
            <div className="flex items-center justify-between">
              <span>QUERIES</span>
              <span>1,247</span>
            </div>
          </div>
        </div>
      </div>

      {/* Your Vaults */}
      <div className="mb-2 flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
        <span className="text-[8px] text-primary">▼</span>
        Your Vaults
      </div>

      {!isConnected ? (
        <div className="rounded-b-lg border border-panel-border p-10 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            Connect your wallet to view your vaults.
          </p>
        </div>
      ) : loading ? (
        <div className="rounded-b-lg border border-panel-border p-10 text-center">
          <p className="font-mono text-sm text-muted-foreground animate-pulse">
            Loading vaults from Sepolia...
          </p>
        </div>
      ) : vaults.length === 0 ? (
        <div className="rounded-b-lg border border-panel-border p-10 text-center">
          <p className="mb-4 font-mono text-sm text-muted-foreground">
            No vaults found for this wallet.
          </p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/15 px-4 py-2 font-mono text-xs uppercase text-glow transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
          >
            Create Your First Vault
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vaults.map((v) => (
            <div
              key={v.id}
              onClick={() => navigate(`/vault/${v.id}`)}
              className="cursor-pointer rounded-lg border border-border bg-surface1 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-glow hover:shadow-[0_4px_20px_hsl(var(--primary)/0.1)]"
            >
              <div className="mb-4 flex items-start justify-between">
                <h3 className="text-lg font-semibold">Vault #{v.id}</h3>
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    v.entry.active
                      ? "bg-emerald shadow-[0_0_6px_hsl(var(--emerald))]"
                      : "bg-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex flex-col gap-2 font-mono text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>CREATOR</span>
                  <span>{truncateAddr(v.entry.creator)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>CREATED</span>
                  <span>{new Date(v.entry.createdAt * 1000).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>IPFS CID</span>
                  <span className="max-w-[140px] truncate">{v.entry.ipfsCID}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
