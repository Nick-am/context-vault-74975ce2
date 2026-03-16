import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { CONTEXT_VAULT_ABI } from "../../lib/abi/ContextVault";
import { CONTEXT_VAULT_ADDRESS, CHAIN_ID } from "../../lib/addresses";

const SEPOLIA_RPC_URL = "https://rpc.sepolia.org";

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});

export interface VaultEntry {
  ipfsCID: string;
  creator: string;
  createdAt: number;
  active: boolean;
  metadataURI: string;
}

export interface VerifyResult {
  allowed: boolean;
  entry: VaultEntry;
}

const contractParams = {
  address: CONTEXT_VAULT_ADDRESS as `0x${string}`,
  abi: CONTEXT_VAULT_ABI,
} as const;

export async function verifyAccess(
  vaultId: number,
  walletAddress: `0x${string}`
): Promise<VerifyResult> {
  const hasAccess = await (publicClient as any).readContract({
    ...contractParams,
    functionName: "hasAccess",
    args: [BigInt(vaultId), walletAddress],
  });

  const entry = await (publicClient as any).readContract({
    ...contractParams,
    functionName: "getEntry",
    args: [BigInt(vaultId)],
  });

  const [ipfsCID, creator, createdAt, active, metadataURI] = entry as [
    string, `0x${string}`, bigint, boolean, string
  ];

  return {
    allowed: hasAccess as boolean,
    entry: { ipfsCID, creator, createdAt: Number(createdAt), active, metadataURI },
  };
}

export async function getEntryCount(): Promise<number> {
  const count = await (publicClient as any).readContract({
    ...contractParams,
    functionName: "entryCount",
  });
  return Number(count);
}

export async function getCreatorEntries(creator: `0x${string}`): Promise<number[]> {
  const ids = await (publicClient as any).readContract({
    ...contractParams,
    functionName: "getCreatorEntries",
    args: [creator],
  });
  return (ids as bigint[]).map(Number);
}

export async function getEntry(vaultId: number): Promise<VaultEntry> {
  const entry = await (publicClient as any).readContract({
    ...contractParams,
    functionName: "getEntry",
    args: [BigInt(vaultId)],
  });

  const [ipfsCID, creator, createdAt, active, metadataURI] = entry as [
    string, `0x${string}`, bigint, boolean, string
  ];

  return { ipfsCID, creator, createdAt: Number(createdAt), active, metadataURI };
}

export { CONTEXT_VAULT_ABI, CONTEXT_VAULT_ADDRESS, CHAIN_ID };
