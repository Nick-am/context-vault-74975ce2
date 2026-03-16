import { NextRequest } from "next/server";
import { uploadEncrypted, uploadMetadata, type VaultMetadata } from "@/lib/ipfs";

interface UploadRequest {
  encryptedBytes: string; // base64 encoded
  metadataJSON: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: UploadRequest = await req.json();
    const { encryptedBytes, metadataJSON } = body;

    if (!encryptedBytes || !metadataJSON) {
      return Response.json({ error: "Missing encryptedBytes or metadataJSON" }, { status: 400 });
    }

    // Decode base64 to Uint8Array
    const binaryString = atob(encryptedBytes);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    let metadata: VaultMetadata;
    try {
      metadata = JSON.parse(metadataJSON);
    } catch {
      return Response.json({ error: "Invalid metadataJSON" }, { status: 400 });
    }

    if (!metadata.name || !metadata.description || !metadata.category) {
      return Response.json({ error: "Metadata must include name, description, and category" }, { status: 400 });
    }

    const [encryptedCID, metadataCID] = await Promise.all([
      uploadEncrypted(bytes),
      uploadMetadata(metadata),
    ]);

    return Response.json({ encryptedCID, metadataCID });
  } catch (error) {
    console.error("Upload API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
