import { createPublicClient, createWalletClient, custom, http } from "viem";
import { sepolia } from "viem/chains";
import { CONTEXT_VAULT_ABI } from "../../lib/abi/ContextVault";
import { CONTEXT_VAULT_ADDRESS, CHAIN_ID } from "../../lib/addresses";

const RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

/**
 * Create a wallet client from the browser's injected provider (MetaMask).
 */
export function getWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet provider found — install MetaMask");
  }
  return createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  });
}

// ─── Read functions ──────────────────────────────────────────────

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

export async function getEntryCount(): Promise<number> {
  const count = await publicClient.readContract({
    ...contractParams,
    functionName: "entryCount",
  });
  return Number(count);
}

export async function getEntry(vaultId: number): Promise<VaultEntry> {
  const entry = await publicClient.readContract({
    ...contractParams,
    functionName: "getEntry",
    args: [BigInt(vaultId)],
  });

  const [ipfsCID, creator, createdAt, active, metadataURI] = entry as [
    string, `0x${string}`, bigint, boolean, string
  ];

  return { ipfsCID, creator, createdAt: Number(createdAt), active, metadataURI };
}

export async function getCreatorEntries(creator: `0x${string}`): Promise<number[]> {
  const ids = await publicClient.readContract({
    ...contractParams,
    functionName: "getCreatorEntries",
    args: [creator],
  });
  return (ids as bigint[]).map(Number);
}

export async function hasAccess(entryId: number, addr: `0x${string}`): Promise<boolean> {
  return publicClient.readContract({
    ...contractParams,
    functionName: "hasAccess",
    args: [BigInt(entryId), addr],
  }) as Promise<boolean>;
}

export async function verifyAccess(
  vaultId: number,
  walletAddress: `0x${string}`
): Promise<VerifyResult> {
  const [allowed, entry] = await Promise.all([
    hasAccess(vaultId, walletAddress),
    getEntry(vaultId),
  ]);
  return { allowed, entry };
}

// ─── Write functions ─────────────────────────────────────────────

export async function createEntry(
  encryptedContentHash: `0x${string}`,
  proof: `0x${string}`,
  ipfsCID: string,
  metadataURI: string
): Promise<`0x${string}`> {
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  return walletClient.writeContract({
    account,
    ...contractParams,
    functionName: "createEntry",
    args: [encryptedContentHash, proof, ipfsCID, metadataURI],
  });
}

export async function grantAccess(
  entryId: number,
  addr: `0x${string}`
): Promise<`0x${string}`> {
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  return walletClient.writeContract({
    account,
    ...contractParams,
    functionName: "grantAccess",
    args: [BigInt(entryId), addr],
  });
}

export async function revokeAccess(
  entryId: number,
  addr: `0x${string}`
): Promise<`0x${string}`> {
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  return walletClient.writeContract({
    account,
    ...contractParams,
    functionName: "revokeAccess",
    args: [BigInt(entryId), addr],
  });
}

export async function logAccess(entryId: number): Promise<`0x${string}`> {
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  return walletClient.writeContract({
    account,
    ...contractParams,
    functionName: "logAccess",
    args: [BigInt(entryId)],
  });
}

/**
 * Sign a message for vault chat access verification.
 */
export async function signChatAccess(vaultId: number): Promise<{
  walletAddress: `0x${string}`;
  signature: `0x${string}`;
}> {
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();
  const message = `ContextVault chat access: vault ${vaultId}`;
  const signature = await walletClient.signMessage({ account, message });
  return { walletAddress: account, signature };
}

/**
 * Wait for a transaction to be confirmed.
 */
export async function waitForTransaction(hash: `0x${string}`) {
  return publicClient.waitForTransactionReceipt({ hash });
}

// Re-export constants for convenience
export { CONTEXT_VAULT_ABI, CONTEXT_VAULT_ADDRESS, CHAIN_ID };
