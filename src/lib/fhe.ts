import { initFhevm, createInstance, type FhevmInstance } from "fhevmjs/web";
import { CONTEXT_VAULT_ADDRESS } from "../../lib/addresses";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Zama's Sepolia fhevm contract addresses
// See: https://docs.zama.ai/fhevm/fundamentals/contracts
const KMS_CONTRACT_ADDRESS = "0x208De73316E44722e16f6dDFF40881A3e4F86104";
const ACL_CONTRACT_ADDRESS = "0xFee8407e2f5e3Ee68ad77cAE98c434e637f516e0";
const GATEWAY_URL = "https://gateway.sepolia.zama.ai";

let instance: FhevmInstance | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize fhevmjs (loads WASM, fetches public key from gateway).
 * Safe to call multiple times — only initializes once.
 */
export async function ensureFhevm(): Promise<FhevmInstance> {
  if (instance) return instance;

  if (!initPromise) {
    initPromise = (async () => {
      await initFhevm();
      instance = await createInstance({
        kmsContractAddress: KMS_CONTRACT_ADDRESS,
        aclContractAddress: ACL_CONTRACT_ADDRESS,
        network: window.ethereum as any,
        gatewayUrl: GATEWAY_URL,
      });
    })();
  }

  await initPromise;
  return instance!;
}

/**
 * Encrypt a uint256 value (e.g. keccak256 hash) for use with createEntry.
 * Returns the einput (bytes32 handle) and proof (bytes) needed by the contract.
 */
export async function encryptUint256(
  value: bigint,
  userAddress: string
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> {
  const fhevm = await ensureFhevm();

  const input = fhevm.createEncryptedInput(CONTEXT_VAULT_ADDRESS, userAddress);
  input.add256(value);

  const encrypted = await input.encrypt();

  // handles[0] is the bytes32 einput handle, inputProof is the proof bytes
  const handle = ("0x" + bytesToHex(encrypted.handles[0])) as `0x${string}`;
  const proof = ("0x" + bytesToHex(encrypted.inputProof)) as `0x${string}`;

  return { handle, proof };
}
