import { NextRequest } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { CONTEXT_VAULT_ABI } from "@/lib/abi/ContextVault";
import { CONTEXT_VAULT_ADDRESS } from "@/lib/addresses";

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
});

interface VerifyRequest {
  vaultId: number;
  walletAddress: `0x${string}`;
}

export async function POST(req: NextRequest) {
  try {
    const body: VerifyRequest = await req.json();
    const { vaultId, walletAddress } = body;

    if (vaultId === undefined || !walletAddress) {
      return Response.json({ error: "Missing vaultId or walletAddress" }, { status: 400 });
    }

    const hasAccess = await publicClient.readContract({
      address: CONTEXT_VAULT_ADDRESS as `0x${string}`,
      abi: CONTEXT_VAULT_ABI,
      functionName: "hasAccess",
      args: [BigInt(vaultId), walletAddress],
    });

    const entry = await publicClient.readContract({
      address: CONTEXT_VAULT_ADDRESS as `0x${string}`,
      abi: CONTEXT_VAULT_ABI,
      functionName: "getEntry",
      args: [BigInt(vaultId)],
    });

    const [ipfsCID, creator, createdAt, active, metadataURI] = entry as [
      string,
      `0x${string}`,
      bigint,
      boolean,
      string,
    ];

    return Response.json({
      allowed: hasAccess,
      entry: {
        ipfsCID,
        creator,
        createdAt: Number(createdAt),
        active,
        metadataURI,
      },
    });
  } catch (error) {
    console.error("Verify API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
