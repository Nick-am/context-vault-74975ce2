import { CONTEXT_VAULT_ADDRESS } from "../../lib/addresses";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Zama's Sepolia fhevm contract addresses (from fhevmjs configs.ts)
// See: https://github.com/zama-ai/fhevmjs/blob/main/src/configs.ts
const KMS_CONTRACT_ADDRESS = "0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A";
const ACL_CONTRACT_ADDRESS = "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D";
const RELAYER_URL = "https://relayer.testnet.zama.org/v1";

let instance: any = null;
let initPromise: Promise<void> | null = null;
let fheAvailable = true;

/**
 * Patch WebAssembly.Memory to enforce minimum 20 initial pages.
 * fhevmjs WASM modules can hit a mismatch (19 vs 20 pages) in some browsers.
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
 * Initialize fhevmjs (loads WASM, fetches public key from gateway).
 * Safe to call multiple times — only initializes once.
 * Falls back to demo mode if WASM/SharedArrayBuffer is unavailable.
 */
export async function ensureFhevm(): Promise<any> {
  if (instance) return instance;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        // Patch WASM Memory to fix 19-vs-20 page mismatch
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
        console.warn("fhevmjs WASM init failed, using demo mode:", e);
        fheAvailable = false;
        instance = null;
      }
    })();
  }

  await initPromise;
  return instance;
}

/**
 * Encrypt a uint256 value (e.g. keccak256 hash) for use with createEntry.
 * Returns the einput (bytes32 handle) and proof (bytes) needed by the contract.
 *
 * If fhevmjs WASM fails to load, falls back to a deterministic demo encoding
 * derived from the content hash — the on-chain TFHE coprocessor will reject it,
 * but the rest of the UX flow still works for demonstration purposes.
 */
export async function encryptUint256(
  value: bigint,
  userAddress: string
): Promise<{ handle: `0x${string}`; proof: `0x${string}`; demoMode: boolean }> {
  const fhevm = await ensureFhevm();

  if (fhevm && fheAvailable) {
    try {
      const input = fhevm.createEncryptedInput(CONTEXT_VAULT_ADDRESS, userAddress);
      input.add256(value);
      const encrypted = await input.encrypt();

      const handle = ("0x" + bytesToHex(encrypted.handles[0])) as `0x${string}`;
      const proof = ("0x" + bytesToHex(encrypted.inputProof)) as `0x${string}`;

      return { handle, proof, demoMode: false };
    } catch (e) {
      console.warn("FHE encryption failed, falling back to demo mode:", e);
    }
  }

  // Demo fallback: use the content hash as handle and a minimal proof
  // This lets the full create-vault UX flow work for demonstration
  const hashHex = value.toString(16).padStart(64, "0");
  const handle = `0x${hashHex}` as `0x${string}`;
  // 65-byte dummy proof (contract may reject but UX flow completes)
  const proof = `0x${"00".repeat(65)}` as `0x${string}`;

  return { handle, proof, demoMode: true };
}
