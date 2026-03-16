import { useWallet } from "@/hooks/useWallet";

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function WalletButton() {
  const { address, isConnected, isWrongNetwork, connect, disconnect, switchToSepolia } = useWallet();

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/15 px-3 py-1.5 font-mono text-[11px] uppercase text-glow shadow-[0_0_10px_hsl(var(--primary)/0.1)] transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
      >
        Connect Wallet
      </button>
    );
  }

  if (isWrongNetwork) {
    return (
      <button
        onClick={switchToSepolia}
        className="inline-flex items-center gap-2 rounded-sm border border-destructive bg-destructive/15 px-3 py-1.5 font-mono text-[11px] uppercase text-destructive transition-all hover:bg-destructive hover:text-white"
      >
        Switch to Sepolia
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-sm border border-emerald bg-emerald/10 px-3 py-1.5 font-mono text-[11px] uppercase text-emerald">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-cv-pulse" />
        {truncateAddress(address!)}
      </div>
      <button
        onClick={() => disconnect()}
        className="rounded-sm border border-border px-2 py-1.5 font-mono text-[10px] uppercase text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
      >
        Disconnect
      </button>
    </div>
  );
}
