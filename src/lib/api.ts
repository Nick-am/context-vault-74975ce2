import { verifyMessage } from "viem";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  vaultId: number;
  decryptedContext: string;
  userMessage: string;
  history: ChatMessage[];
  walletAddress: string;
  signature: string;
}

export type OnChunkCallback = (text: string) => void;

/**
 * Verify wallet signature client-side before sending chat request.
 */
export async function verifyWalletSignature(
  vaultId: number,
  walletAddress: `0x${string}`,
  signature: `0x${string}`
): Promise<boolean> {
  const message = `ContextVault chat access: vault ${vaultId}`;
  return verifyMessage({ address: walletAddress, message, signature });
}

/**
 * Send a chat message. If VITE_ANTHROPIC_API_KEY is set, streams real
 * responses from Claude. Otherwise returns a simulated FHE-themed reply.
 */
export async function sendChatMessage(
  request: ChatRequest,
  onChunk: OnChunkCallback
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (apiKey) {
    return streamFromAnthropic(apiKey, request, onChunk);
  }

  // Simulated response for demo / no-backend mode
  return simulateResponse(request.userMessage, onChunk);
}

async function streamFromAnthropic(
  apiKey: string,
  request: ChatRequest,
  onChunk: OnChunkCallback
): Promise<string> {
  const messages = [
    ...request.history.map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: "user" as const, content: request.userMessage },
  ];

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: request.decryptedContext,
      messages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${errorText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return full;

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "content_block_delta" && parsed.delta?.text) {
          full += parsed.delta.text;
          onChunk(parsed.delta.text);
        }
      } catch {
        // skip unparseable lines
      }
    }
  }

  return full;
}

async function simulateResponse(
  userMessage: string,
  onChunk: OnChunkCallback
): Promise<string> {
  const response = `Accessing encrypted context via FHE...\n\nBased on the vault's confidential parameters, I've computed a response using the encrypted context. The analysis indicates that "${userMessage.slice(0, 40)}..." relates to parameters governed by the secure prompt constraints. The FHE computation completed successfully without decrypting the underlying data.`;

  let full = "";
  const words = response.split(" ");

  for (const word of words) {
    const token = (full ? " " : "") + word;
    full += token;
    onChunk(token);
    await new Promise((r) => setTimeout(r, 30 + Math.random() * 40));
  }

  return full;
}

/**
 * Upload encrypted bytes and metadata to IPFS via Pinata.
 * Falls back to fake CIDs in demo mode if Pinata keys aren't set.
 */
export async function uploadToIPFS(
  encryptedBytes: Uint8Array,
  metadata: { name: string; description: string; category: string }
): Promise<{ encryptedCID: string; metadataCID: string }> {
  const apiKey = import.meta.env.VITE_PINATA_API_KEY;
  const secretKey = import.meta.env.VITE_PINATA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    // Demo mode — return fake CIDs
    return {
      encryptedCID: `bafybei${Date.now().toString(36)}fake`,
      metadataCID: `bafybei${Date.now().toString(36)}meta`,
    };
  }

  const headers = {
    pinata_api_key: apiKey,
    pinata_secret_api_key: secretKey,
  };

  // Upload encrypted blob
  const blob = new Blob([encryptedBytes as BlobPart], { type: "application/octet-stream" });
  const formData = new FormData();
  formData.append("file", blob, "encrypted-context.bin");

  const encRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers,
    body: formData,
  });
  if (!encRes.ok) {
    throw new Error(`IPFS upload failed: ${encRes.status} ${await encRes.text()}`);
  }
  const encJson = await encRes.json();

  // Upload metadata JSON
  const metaRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `vault-metadata-${Date.now()}` },
    }),
  });
  if (!metaRes.ok) {
    throw new Error(`Metadata upload failed: ${metaRes.status} ${await metaRes.text()}`);
  }
  const metaJson = await metaRes.json();

  return {
    encryptedCID: encJson.IpfsHash,
    metadataCID: metaJson.IpfsHash,
  };
}

/**
 * Fetch encrypted data from IPFS by CID.
 */
export async function fetchFromIPFS(cid: string): Promise<Uint8Array> {
  const gateway = import.meta.env.VITE_IPFS_GATEWAY || "https://cloudflare-ipfs.com/ipfs/";
  const res = await fetch(`${gateway}${cid}`);
  if (!res.ok) {
    throw new Error(`IPFS fetch failed: ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}
