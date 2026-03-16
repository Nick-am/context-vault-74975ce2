import { CONTEXT_VAULT_ADDRESS } from "../../lib/addresses";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Zama's Sepolia fhevm contract addresses (from fhevmjs configs.ts)
const KMS_CONTRACT_ADDRESS = "0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A";
const ACL_CONTRACT_ADDRESS = "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D";
const RELAYER_URL = "https://relayer.testnet.zama.org/v1/";

let instance: any = null;
let initPromise: Promise<void> | null = null;
let fheAvailable = true;

/**
 * FHE encryption server URLs to try, in order:
 * 1. Standalone fhe-server.mjs (for use with Lovable hosted preview)
 * 2. Vite dev middleware (for local npm run dev)
 */
const FHE_SERVER_URLS = [
  "http://localhost:3099/api/fhe-encrypt",
  "/api/fhe-encrypt",
];

/**
 * Try server-side FHE encryption.
 * Tries standalone fhe-server first, then Vite dev middleware.
 */
async function serverSideEncrypt(
  value: bigint,
  userAddress: string
): Promise<{ handle: `0x${string}`; proof: `0x${string}` } | null> {
  const body = JSON.stringify({
    value: value.toString(),
    userAddress,
    contractAddress: CONTEXT_VAULT_ADDRESS,
  });

  for (const url of FHE_SERVER_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.error) continue;
      return { handle: data.handle as `0x${string}`, proof: data.proof as `0x${string}` };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Patch WebAssembly.Memory to enforce minimum 20 initial pages.
 */
function patchWasmMemory() {
  const OriginalMemory = WebAssembly.Memory;
  WebAssembly.Memory = class PatchedMemory extends OriginalMemory {
    constructor(descriptor: WebAssembly.MemoryDescriptor) {
      if (descriptor.initial !== undefined && descriptor.initial < 20 && (descriptor as any).shared) {
        descriptor.initial = 20;
      }
      super(descriptor);
    }
  } as any;
}

/**
 * Initialize fhevmjs client-side (fallback if server endpoint unavailable).
 */
export async function ensureFhevm(): Promise<any> {
  if (instance) return instance;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        patchWasmMemory();
        const { initFhevm, createInstance } = await import("fhevmjs/web");
        await initFhevm();
        instance = await createInstance({
          kmsContractAddress: KMS_CONTRACT_ADDRESS,
          aclContractAddress: ACL_CONTRACT_ADDRESS,
          network: window.ethereum as any,
          relayerUrl: RELAYER_URL,
        });
      } catch (e) {
        console.warn("fhevmjs WASM init failed:", e);
        fheAvailable = false;
        instance = null;
      }
    })();
  }

  await initPromise;
  return instance;
}

/**
 * Encrypt a uint256 value for use with createEntry.
 *
 * Strategy:
 * 1. Try server-side encryption (Node.js — no WASM issues)
 * 2. Try client-side fhevmjs (browser WASM)
 * 3. Fall back to demo mode (dummy values — will revert on-chain)
 */
export async function encryptUint256(
  value: bigint,
  userAddress: string
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> {
  // 1. Server-side (most reliable — works via Vite dev middleware)
  const serverResult = await serverSideEncrypt(value, userAddress);
  if (serverResult) {
    return serverResult;
  }

  // 2. Client-side WASM (requires SharedArrayBuffer / COOP+COEP headers)
  const fhevm = await ensureFhevm();
  if (fhevm && fheAvailable) {
    try {
      const input = fhevm.createEncryptedInput(CONTEXT_VAULT_ADDRESS, userAddress);
      input.add256(value);
      const encrypted = await input.encrypt();

      const handle = ("0x" + bytesToHex(encrypted.handles[0])) as `0x${string}`;
      const proof = ("0x" + bytesToHex(encrypted.inputProof)) as `0x${string}`;

      return { handle, proof };
    } catch (e) {
      console.warn("FHE client encryption failed:", e);
    }
  }

  // 3. No FHE available — throw a clear error
  throw new Error(
    "FHE encryption unavailable. Run 'node fhe-server.mjs' in the project directory " +
    "to start the FHE encryption server, then retry."
  );
}
