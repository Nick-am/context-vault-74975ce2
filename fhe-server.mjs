/**
 * Standalone FHE encryption server.
 *
 * Run: node fhe-server.mjs
 *
 * Provides POST /api/fhe-encrypt that the frontend calls.
 * Works independently of Vite — use alongside Lovable's hosted preview.
 */
import http from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const nodeTfhe = require("node-tfhe");
const { ethers } = require("ethers");

const PORT = parseInt(process.env.FHE_PORT || "3099", 10);
const RELAYER_URL = "https://relayer.testnet.zama.org/v1/";
const ACL_ADDRESS = "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D";
const RPC_URL = process.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const SERIALIZED_SIZE_LIMIT = BigInt(1024 * 1024 * 512);

let createEncInput = null;
let loadingPromise = null;

function fromHexString(hex) {
  const arr = hex.replace(/^0x/, "").match(/.{1,2}/g);
  return arr ? Uint8Array.from(arr.map((b) => parseInt(b, 16))) : new Uint8Array();
}
function toHexString(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function numberToHex(num) {
  let hex = num.toString(16);
  return hex.length % 2 ? "0" + hex : hex;
}

async function loadFhe() {
  if (createEncInput) return;
  if (loadingPromise) { await loadingPromise; return; }

  loadingPromise = (async () => {
    console.log("[fhe-server] Fetching public key and CRS from Zama relayer...");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    const keyData = await (await fetch(`${RELAYER_URL}keyurl`)).json();
    const keyInfo = keyData.response.fhe_key_info[0].fhe_public_key;
    const pubKeyBytes = new Uint8Array(await (await fetch(keyInfo.urls[0])).arrayBuffer());
    const publicKey = nodeTfhe.TfheCompactPublicKey.safe_deserialize(pubKeyBytes, SERIALIZED_SIZE_LIMIT);

    const crsInfo = keyData.response.crs["2048"];
    const crsBytes = new Uint8Array(await (await fetch(crsInfo.urls[0])).arrayBuffer());
    const publicParams = nodeTfhe.CompactPkeCrs.safe_deserialize(crsBytes, SERIALIZED_SIZE_LIMIT);

    console.log("[fhe-server] Keys loaded (chain:", chainId, ")");

    createEncInput = (contractAddress, userAddress) => {
      const builder = nodeTfhe.CompactCiphertextList.builder(publicKey);
      return {
        add256(value) {
          builder.push_u256(BigInt(value));
          return this;
        },
        async encrypt() {
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

          let inputProof = numberToHex(handles.length);
          inputProof += numberToHex(signatures.length);
          handles.forEach((h) => (inputProof += toHexString(h)));
          signatures.forEach((s) => (inputProof += s.replace(/^0x/, "")));

          return { handles, inputProof: fromHexString(inputProof) };
        },
      };
    };

    console.log("[fhe-server] Ready on port", PORT);
  })();

  await loadingPromise;
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url !== "/api/fhe-encrypt" || req.method !== "POST") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  let body = "";
  for await (const chunk of req) body += chunk;

  try {
    await loadFhe();
    const { value, userAddress, contractAddress } = JSON.parse(body);
    const input = createEncInput(contractAddress, userAddress);
    input.add256(BigInt(value));
    const encrypted = await input.encrypt();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      handle: "0x" + toHexString(encrypted.handles[0]),
      proof: "0x" + toHexString(encrypted.inputProof),
    }));
  } catch (e) {
    console.error("FHE encrypt error:", e);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e.message || "FHE encryption failed" }));
  }
});

server.listen(PORT, () => {
  console.log(`[fhe-server] Listening on http://localhost:${PORT}`);
  console.log("[fhe-server] First request will take ~30s to load keys...");
});
