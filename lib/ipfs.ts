const PINATA_API_URL = "https://api.pinata.cloud";

interface VaultMetadata {
  name: string;
  description: string;
  category: string;
}

async function pinataHeaders(): Promise<Record<string, string>> {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error("PINATA_API_KEY and PINATA_SECRET_KEY must be set");
  }
  return {
    pinata_api_key: apiKey,
    pinata_secret_api_key: secretKey,
  };
}

export async function uploadEncrypted(data: Uint8Array): Promise<string> {
  const headers = await pinataHeaders();
  const blob = new Blob([data as unknown as ArrayBuffer], { type: "application/octet-stream" });
  const formData = new FormData();
  formData.append("file", blob, "encrypted-context.bin");

  const res = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`IPFS upload failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  return json.IpfsHash as string;
}

export async function fetchEncrypted(cid: string): Promise<Uint8Array> {
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://cloudflare-ipfs.com/ipfs/";
  const res = await fetch(`${gateway}${cid}`);

  if (!res.ok) {
    throw new Error(`IPFS fetch failed: ${res.status}`);
  }

  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function uploadMetadata(meta: VaultMetadata): Promise<string> {
  const headers = await pinataHeaders();

  const res = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: meta,
      pinataMetadata: { name: `vault-metadata-${Date.now()}` },
    }),
  });

  if (!res.ok) {
    throw new Error(`Metadata upload failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  return json.IpfsHash as string;
}

export type { VaultMetadata };
