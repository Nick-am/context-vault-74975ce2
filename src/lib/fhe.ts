import { initFhevm, createInstance, type FhevmInstance } from "fhevmjs/web";
import { CONTEXT_VAULT_ADDRESS } from "../../lib/addresses";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Zama's Sepolia fhevm contract addresses
// See: https://docs.zama.org/protocol/solidity-guides/smart-contract/configure/contract_addresses
const KMS_CONTRACT_ADDRESS = "0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A";
const ACL_CONTRACT_ADDRESS = "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D";
const GATEWAY_URL = "https://relayer.testnet.zama.org";

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
