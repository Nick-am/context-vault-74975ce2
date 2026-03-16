/**
 * Chat API — streams responses from Anthropic Claude.
 *
 * NOTE: The Anthropic API requires a secret key and cannot be called directly
 * from the browser due to CORS and key exposure. In production, this should
 * be routed through a backend (edge function, proxy, etc.).
 *
 * For now this module exposes the interface so the frontend can be wired up,
 * and falls back to a simulated response when no backend is available.
 */

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
 * Send a chat message. If a backend endpoint is configured via
 * VITE_CHAT_API_URL, it streams real responses. Otherwise it
 * returns a simulated FHE-themed reply.
 */
export async function sendChatMessage(
  request: ChatRequest,
  onChunk: OnChunkCallback
): Promise<string> {
  const apiUrl = import.meta.env.VITE_CHAT_API_URL;

  if (apiUrl) {
    return streamFromBackend(apiUrl, request, onChunk);
  }

  // Simulated response for demo / no-backend mode
  return simulateResponse(request.userMessage, onChunk);
}

async function streamFromBackend(
  url: string,
  request: ChatRequest,
  onChunk: OnChunkCallback
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === "[DONE]") break;

      try {
        const parsed = JSON.parse(data);
        if (parsed.text) {
          full += parsed.text;
          onChunk(parsed.text);
        }
      } catch {
        // skip malformed chunks
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
 * Upload encrypted context + metadata to IPFS.
 * Requires VITE_UPLOAD_API_URL to be set for real uploads.
 */
export async function uploadToIPFS(
  encryptedBytes: Uint8Array,
  metadata: { name: string; description: string; category: string }
): Promise<{ encryptedCID: string; metadataCID: string }> {
  const apiUrl = import.meta.env.VITE_UPLOAD_API_URL;

  if (!apiUrl) {
    // Demo mode — return fake CIDs
    return {
      encryptedCID: `bafybei${Date.now().toString(36)}fake`,
      metadataCID: `bafybei${Date.now().toString(36)}meta`,
    };
  }

  const base64 = btoa(String.fromCharCode(...encryptedBytes));

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      encryptedBytes: base64,
      metadataJSON: JSON.stringify(metadata),
    }),
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }

  return res.json();
}
