import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { sendChatMessage, type ChatMessage } from "../lib/api";
import {
  getEntry,
  hasAccess,
  grantAccess,
  revokeAccess,
  signChatAccess,
  waitForTransaction,
  type VaultEntry,
} from "../lib/contract";

export default function VaultDetail() {
  const { id } = useParams<{ id: string }>();
  const vaultId = Number(id) || 0;
  const { address, isConnected } = useWallet();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [entry, setEntry] = useState<VaultEntry | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Chat signing state
  const [chatSigned, setChatSigned] = useState(false);
  const [chatSignature, setChatSignature] = useState<string>("");
  const [signing, setSigning] = useState(false);

  // Access management
  const [grantAddr, setGrantAddr] = useState("");
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessSuccess, setAccessSuccess] = useState<string | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load on-chain entry data
  useEffect(() => {
    getEntry(vaultId)
      .then(setEntry)
      .catch(() => {});
  }, [vaultId]);

  // Reset chat signing when wallet changes
  useEffect(() => {
    setChatSigned(false);
    setChatSignature("");
  }, [address]);

  const metadata = [
    { label: "ID", value: `VLT-${vaultId}` },
    { label: "Creator", value: entry ? `${entry.creator.slice(0, 6)}...${entry.creator.slice(-4)}` : "..." },
    { label: "Status", value: entry?.active ? "ACTIVE" : "INACTIVE" },
  ];

  async function handleSignChat() {
    if (!isConnected) return;
    setSigning(true);
    try {
      const { signature } = await signChatAccess(vaultId);
      setChatSignature(signature);
      setChatSigned(true);
    } catch {
      // user rejected or error
    } finally {
      setSigning(false);
    }
  }

  const handleSend = async () => {
    if (!message.trim() || streaming) return;

    const userMsg = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      await sendChatMessage(
        {
          vaultId,
          decryptedContext: entry?.ipfsCID
            ? `Encrypted FHE context from IPFS: ${entry.ipfsCID}`
            : "Encrypted FHE context placeholder",
          userMessage: userMsg,
          history: messages,
          walletAddress: address || "0x0000000000000000000000000000000000000000",
          signature: chatSignature || "0x",
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

  async function handleGrantAccess() {
    if (!grantAddr.match(/^0x[a-fA-F0-9]{40}$/)) {
      setAccessError("Invalid Ethereum address");
      return;
    }
    setAccessLoading(true);
    setAccessError(null);
    setAccessSuccess(null);
    try {
      const hash = await grantAccess(vaultId, grantAddr as `0x${string}`);
      await waitForTransaction(hash);
      setAccessSuccess(`Access granted to ${grantAddr.slice(0, 6)}...${grantAddr.slice(-4)}`);
      setGrantAddr("");
    } catch (e: any) {
      setAccessError(e.message || "Grant failed");
    } finally {
      setAccessLoading(false);
    }
  }

  async function handleRevokeAccess() {
    if (!grantAddr.match(/^0x[a-fA-F0-9]{40}$/)) {
      setAccessError("Invalid Ethereum address");
      return;
    }
    setAccessLoading(true);
    setAccessError(null);
    setAccessSuccess(null);
    try {
      const hash = await revokeAccess(vaultId, grantAddr as `0x${string}`);
      await waitForTransaction(hash);
      setAccessSuccess(`Access revoked from ${grantAddr.slice(0, 6)}...${grantAddr.slice(-4)}`);
      setGrantAddr("");
    } catch (e: any) {
      setAccessError(e.message || "Revoke failed");
    } finally {
      setAccessLoading(false);
    }
  }

  return (
    <div className="mt-6 grid h-[calc(100vh-150px)] grid-cols-[320px_1fr] gap-8">
      {/* Left sidebar */}
      <div className="flex flex-col gap-4 overflow-y-auto pr-2">
        {/* Active badge */}
        <div className={`mb-4 inline-flex w-fit items-center gap-2 rounded-sm border px-3 py-1.5 font-mono text-[11px] uppercase ${
          entry?.active !== false
            ? "border-emerald bg-emerald/10 text-emerald"
            : "border-muted-foreground bg-muted/10 text-muted-foreground"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${entry?.active !== false ? "bg-emerald animate-cv-pulse" : "bg-muted-foreground"}`} />
          {entry?.active !== false ? "Context Active" : "Inactive"}
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
            <p><span className="text-foreground">TIMESTAMP:</span> {entry ? new Date(entry.createdAt * 1000).toISOString() : "..."}</p>
            <p className="break-all"><span className="text-foreground">IPFS CID:</span> {entry?.ipfsCID || "..."}</p>
            <p className="break-all"><span className="text-foreground">METADATA:</span> {entry?.metadataURI || "..."}</p>
          </div>
        </div>

        {/* Access management */}
        {isConnected && (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
              <span className="text-[8px] text-primary">▼</span>
              Access Control
            </div>
            <div className="rounded-b-lg border border-panel-border p-4">
              <input
                type="text"
                value={grantAddr}
                onChange={(e) => setGrantAddr(e.target.value)}
                placeholder="0x address..."
                className="mb-2 w-full rounded-sm border border-border bg-surface1 px-2 py-1.5 font-mono text-[11px] outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleGrantAccess}
                  disabled={accessLoading}
                  className="flex-1 rounded-sm border border-emerald bg-emerald/10 px-2 py-1.5 font-mono text-[10px] uppercase text-emerald transition-colors hover:bg-emerald hover:text-white disabled:opacity-50"
                >
                  Grant
                </button>
                <button
                  onClick={handleRevokeAccess}
                  disabled={accessLoading}
                  className="flex-1 rounded-sm border border-destructive bg-destructive/10 px-2 py-1.5 font-mono text-[10px] uppercase text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
                >
                  Revoke
                </button>
              </div>
              {accessError && (
                <p className="mt-2 font-mono text-[10px] text-destructive">{accessError}</p>
              )}
              {accessSuccess && (
                <p className="mt-2 font-mono text-[10px] text-emerald">{accessSuccess}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right chat panel */}
      <div className="flex flex-col rounded-lg border border-panel-border bg-surface1">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-glow">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--glow))]" />
            FHE Context Pinned (Encrypted)
          </div>
          <div className="flex items-center gap-3">
            {isConnected && !chatSigned && (
              <button
                onClick={handleSignChat}
                disabled={signing}
                className="rounded-sm border border-primary bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase text-glow transition-all hover:bg-primary hover:text-white disabled:opacity-50"
              >
                {signing ? "Signing..." : "Sign to Chat"}
              </button>
            )}
            {chatSigned && (
              <span className="font-mono text-[10px] text-emerald">Signed</span>
            )}
            <span className="font-mono text-[11px] text-muted-foreground">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
            </span>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="flex flex-1 items-center justify-center">
              <p className="font-mono text-sm text-muted-foreground">
                {chatSigned
                  ? "Start chatting with the vault context..."
                  : isConnected
                    ? "Sign to authenticate, then start chatting."
                    : "Connect wallet and sign to start chatting."}
              </p>
            </div>
          )}
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
            placeholder={chatSigned ? "Type a message..." : "Sign to unlock chat..."}
            disabled={!chatSigned && isConnected}
            className="flex-1 rounded-sm border border-border bg-secondary px-4 py-3 text-foreground outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={streaming || (!chatSigned && isConnected)}
            className="inline-flex items-center gap-2 rounded-sm border border-primary bg-secondary px-4 py-2 font-mono text-xs uppercase text-glow transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
