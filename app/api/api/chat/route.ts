import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createPublicClient, http, verifyMessage } from "viem";
import { sepolia } from "viem/chains";
import { CONTEXT_VAULT_ABI } from "@/lib/abi/ContextVault";
import { CONTEXT_VAULT_ADDRESS } from "@/lib/addresses";

const anthropic = new Anthropic();

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
});

interface ChatRequest {
  vaultId: number;
  decryptedContext: string;
  userMessage: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  walletAddress: `0x${string}`;
  signature: `0x${string}`;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { vaultId, decryptedContext, userMessage, history, walletAddress, signature } = body;

    if (!decryptedContext || !userMessage || !walletAddress || !signature) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify wallet signature
    const message = `ContextVault chat access: vault ${vaultId}`;
    const isValid = await verifyMessage({
      address: walletAddress,
      message,
      signature,
    });
    if (!isValid) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Verify onchain ACL
    const hasAccess = await publicClient.readContract({
      address: CONTEXT_VAULT_ADDRESS as `0x${string}`,
      abi: CONTEXT_VAULT_ABI,
      functionName: "hasAccess",
      args: [BigInt(vaultId), walletAddress],
    });
    if (!hasAccess) {
      return Response.json({ error: "No onchain access" }, { status: 403 });
    }

    // 3. Stream response from Claude — decryptedContext is NEVER logged or stored
    const messages: Anthropic.MessageParam[] = [
      ...history.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: userMessage },
    ];

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: decryptedContext,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
