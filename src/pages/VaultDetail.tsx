import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { sendChatMessage, type ChatMessage } from "../lib/api";
import { getEntry, verifyAccess, type VaultEntry } from "../lib/contract";

export default function VaultDetail() {
  const { id } = useParams<{ id: string }>();
  const vaultId = Number(id) || 0;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "user",
      content:
        "Based on the confidential parameters in the vault, what is the risk assessment for Project Apollo?",
    },
    {
      role: "assistant",
      content:
        'Accessing encrypted context via FHE...\n\nBased on the provided constraints, Project Apollo carries a high risk profile primarily due to the timeline compression parameters specified in section 3 of the secure prompt. I cannot reveal those parameters, but the computation indicates a 78% probability of resource constraint.',
    },
  ]);
  const [streaming, setStreaming] = useState(false);
  const [entry, setEntry] = useState<VaultEntry | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Attempt to load on-chain entry data (fails gracefully in demo mode)
  useEffect(() => {
    getEntry(vaultId)
      .then(setEntry)
      .catch(() => {});
  }, [vaultId]);

  const metadata = [
    { label: "ID", value: entry ? `VLT-${vaultId}` : "VLT-8842" },
    { label: "Category", value: "FINANCE" },
    { label: "Size", value: "4.2 KB" },
  ];

  const handleSend = async () => {
    if (!message.trim() || streaming) return;

    const userMsg = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);

    // Add placeholder assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      await sendChatMessage(
        {
          vaultId,
          decryptedContext: "Encrypted FHE context placeholder",
          userMessage: userMsg,
          history: messages,
          walletAddress: "0x0000000000000000000000000000000000000000",
          signature: "0x",
        },
        (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: updated[updated.length - 1].content + chunk,
            };
            return updated;
          });
        }
      );
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Error: Could not reach the chat backend.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="mt-6 grid h-[calc(100vh-150px)] grid-cols-[320px_1fr] gap-8">
      {/* Left sidebar */}
      <div className="flex flex-col gap-4 overflow-y-auto pr-2">
        {/* Active badge */}
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-sm border border-emerald bg-emerald/10 px-3 py-1.5 font-mono text-[11px] uppercase text-emerald">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-cv-pulse" />
          Context Active
        </div>

        {/* Vault metadata module */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
            <span className="text-[8px] text-primary">▼</span>
            Vault Metadata
          </div>
          <div className="rounded-b-lg border border-panel-border p-4">
            {metadata.map((m) => (
              <div key={m.label} className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                <span className="uppercase tracking-wide text-muted-foreground">{m.label}</span>
                <span className="min-w-[120px] rounded-sm border border-border bg-surface1 px-2 py-1 text-glow">
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cryptographic proof module */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
            <span className="text-[8px] text-primary">▼</span>
            Cryptographic Proof
          </div>
          <div className="rounded-b-lg border border-panel-border p-4 font-mono text-[10px] leading-relaxed text-muted-foreground">
            <p><span className="text-foreground">TX HASH:</span> 0x8f2a...9b4e</p>
            <p><span className="text-foreground">BLOCK:</span> 18,432,109</p>
            <p><span className="text-foreground">TIMESTAMP:</span> {entry ? new Date(entry.createdAt * 1000).toISOString() : "2023-10-27T14:32:00Z"}</p>
            <p className="break-all"><span className="text-foreground">IPFS CID:</span> {entry?.ipfsCID || "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"}</p>
          </div>
        </div>
      </div>

      {/* Right chat panel */}
      <div className="flex flex-col rounded-lg border border-panel-border bg-surface1">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-glow">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--glow))]" />
            FHE Context Pinned (Encrypted)
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">AGENT: 0X4A...B9C2</span>
        </div>

        {/* Chat messages */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <div key={i} className="ml-auto max-w-[80%] rounded-lg border border-border bg-secondary p-4 text-sm">
                {msg.content}
              </div>
            ) : (
              <div key={i} className="relative mr-auto max-w-[80%] rounded-lg border border-panel-border bg-primary/5 p-4 text-sm whitespace-pre-wrap">
                <div className="absolute -left-5 top-5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--glow))]" />
                {msg.content || <span className="text-muted-foreground italic">Thinking...</span>}
              </div>
            )
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <div className="flex gap-3 border-t border-border p-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-sm border border-border bg-secondary px-4 py-3 text-foreground outline-none focus:border-primary"
          />
          <button
            onClick={handleSend}
            disabled={streaming}
            className="inline-flex items-center gap-2 rounded-sm border border-primary bg-secondary px-4 py-2 font-mono text-xs uppercase text-glow transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
