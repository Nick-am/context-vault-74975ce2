/**
 * Vite dev-server plugin: POST /api/fhe-encrypt
 *
 * Runs fhevmjs encryption in Node.js where SharedArrayBuffer works natively.
 * Bypasses createInstance() (which calls getKMSSigners and can fail on testnet)
 * by directly building the encrypted input from fetched public key + CRS.
 */
import type { Plugin } from "vite";

export default function fheEncryptPlugin(): Plugin {
  let createEncInput: ((contractAddr: string, userAddr: string) => any) | null = null;
  let loadingPromise: Promise<void> | null = null;

  async function loadFhe() {
    if (createEncInput) return;
    if (loadingPromise) { await loadingPromise; return; }

    loadingPromise = (async () => {
      const { createRequire } = await import("module");
      const require = createRequire(import.meta.url);
      const { ethers } = require("ethers");
      const nodeTfhe = require("node-tfhe");

      const RELAYER_URL = "https://relayer.testnet.zama.org/v1/";
      const ACL_ADDRESS = "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D";
      const RPC_URL = process.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

      // 1. Get chain ID
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // 2. Fetch public key and CRS from Zama relayer
      const keyData: any = await (await fetch(`${RELAYER_URL}keyurl`)).json();
      const keyInfo = keyData.response.fhe_key_info[0].fhe_public_key;
      const pubKeyBytes = new Uint8Array(await (await fetch(keyInfo.urls[0])).arrayBuffer());
      const publicKey = nodeTfhe.TfheCompactPublicKey.safe_deserialize(
        pubKeyBytes, BigInt(1024 * 1024 * 512)
      );

      const crsInfo = keyData.response.crs["2048"];
      const crsBytes = new Uint8Array(await (await fetch(crsInfo.urls[0])).arrayBuffer());
      const publicParams = nodeTfhe.CompactPkeCrs.safe_deserialize(
        crsBytes, BigInt(1024 * 1024 * 512)
      );

      console.log("[fhe-plugin] Public key and CRS loaded (chain:", chainId, ")");

      // 3. Build createEncryptedInput directly (same logic as fhevmjs/lib/node.cjs)
      //    This bypasses createInstance() and avoids the failing getKMSSigners() call.
      const SERIALIZED_SIZE_LIMIT = BigInt(1024 * 1024 * 512);
      const fromHexString = (hex: string) => {
        const arr = hex.replace(/^0x/, "").match(/.{1,2}/g);
        return arr ? Uint8Array.from(arr.map((b: string) => parseInt(b, 16))) : new Uint8Array();
      };
      const toHexString = (bytes: Uint8Array) =>
        Array.from(bytes, (b: number) => b.toString(16).padStart(2, "0")).join("");
      const numberToHex = (num: number) => {
        let hex = num.toString(16);
        return hex.length % 2 ? "0" + hex : hex;
      };

      createEncInput = (contractAddress: string, userAddress: string) => {
        const builder = nodeTfhe.CompactCiphertextList.builder(publicKey);
        const bits: number[] = [];

        return {
          add256(value: bigint) {
            if (value > BigInt("0x" + "ff".repeat(32)))
              throw new Error("Value exceeds 256-bit limit");
            builder.push_u256(BigInt(value));
            bits.push(256);
            return this;
          },

          async encrypt() {
            // Build ZK proof
            const buffContract = fromHexString(contractAddress);
            const buffUser = fromHexString(userAddress);
            const buffAcl = fromHexString(ACL_ADDRESS);
            const buffChainId = fromHexString(chainId.toString(16));
            const auxData = new Uint8Array(buffContract.length + buffUser.length + buffAcl.length + 32);
            auxData.set(buffContract, 0);
            auxData.set(buffUser, 20);
            auxData.set(buffAcl, 40);
            auxData.set(buffChainId, auxData.length - buffChainId.length);

            const encrypted = builder.build_with_proof_packed(
              publicParams, auxData, nodeTfhe.ZkComputeLoad.Verify
            );
            const ciphertext = Buffer.from(encrypted.safe_serialize(SERIALIZED_SIZE_LIMIT));

            // Submit to relayer for verification and handle generation
            const payload = {
              contractAddress: ethers.getAddress(contractAddress),
              userAddress: ethers.getAddress(userAddress),
              ciphertextWithInputVerification: ciphertext.toString("hex"),
              contractChainId: "0x" + chainId.toString(16),
              extraData: "0x00",
            };

            const response = await fetch(`${RELAYER_URL}input-proof`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              throw new Error(`Relayer error: ${response.status} ${await response.text()}`);
            }

            const json = await response.json();
            const handles = (json.response.handles || []).map(fromHexString);
            const signatures = json.response.signatures || [];

            // Build inputProof: len(handles) + numSigners + handles + signatures
            let inputProof = numberToHex(handles.length);
            inputProof += numberToHex(signatures.length);
            handles.forEach((h: Uint8Array) => (inputProof += toHexString(h)));
            signatures.forEach((s: string) => (inputProof += s.replace(/^0x/, "")));

            return {
              handles,
              inputProof: fromHexString(inputProof),
            };
          },
        };
      };

      console.log("[fhe-plugin] FHE encryption ready");
    })();

    await loadingPromise;
  }

  return {
    name: "fhe-encrypt-api",
    configureServer(server) {
      server.middlewares.use("/api/fhe-encrypt", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        let body = "";
        for await (const chunk of req) body += chunk;

        try {
          await loadFhe();

          const { value, userAddress, contractAddress } = JSON.parse(body);
          const input = createEncInput!(contractAddress, userAddress);
          input.add256(BigInt(value));
          const encrypted = await input.encrypt();

          const bytesToHex = (bytes: Uint8Array) =>
            Array.from(bytes, (b: number) => b.toString(16).padStart(2, "0")).join("");

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            handle: "0x" + bytesToHex(encrypted.handles[0]),
            proof: "0x" + bytesToHex(encrypted.inputProof),
          }));
        } catch (e: any) {
          console.error("FHE encrypt error:", e);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: e.message || "FHE encryption failed" }));
        }
      });
    },
  };
}
