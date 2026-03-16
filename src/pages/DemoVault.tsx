import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function DemoVault() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || streaming) return;
    const userMsg = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const response = "According to my model Tesla is set to increase 5% today";
    let full = "";
    for (const word of response.split(" ")) {
      const token = (full ? " " : "") + word;
      full += token;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: full };
        return updated;
      });
      await new Promise((r) => setTimeout(r, 60 + Math.random() * 40));
    }
    setStreaming(false);
  };

  const metadata = [
    { label: "ID", value: "VLT-DEMO" },
    { label: "Creator", value: "0x1a2B...9f4E" },
    { label: "Status", value: "ACTIVE" },
    { label: "Price", value: "0.01 ETH / query" },
  ];

  return (
    <div className="mt-6 grid h-[calc(100vh-150px)] grid-cols-[320px_1fr] gap-8">
      {/* Left sidebar */}
      <div className="flex flex-col gap-4 overflow-y-auto pr-2">
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-sm border border-emerald bg-emerald/10 px-3 py-1.5 font-mono text-[11px] uppercase text-emerald">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-cv-pulse" />
          Context Active
        </div>

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

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
            <span className="text-[8px] text-primary">▼</span>
            Cryptographic Proof
          </div>
          <div className="rounded-b-lg border border-panel-border p-4 font-mono text-[10px] leading-relaxed text-muted-foreground">
            <p><span className="text-foreground">TIMESTAMP:</span> 2025-03-15T10:30:00.000Z</p>
            <p className="break-all"><span className="text-foreground">IPFS CID:</span> bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi</p>
            <p className="break-all"><span className="text-foreground">FHE SCHEME:</span> TFHE-rs (128-bit security)</p>
          </div>
        </div>
      </div>

      {/* Right chat panel */}
      <div className="flex flex-col rounded-lg border border-panel-border bg-surface1">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-glow">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--glow))]" />
            Equity Analyst — FHE Encrypted
          </div>
          <span className="font-mono text-[10px] text-emerald">Demo Mode</span>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="flex flex-1 items-center justify-center">
              <p className="font-mono text-sm text-muted-foreground">
                Type a message to interact with this vault's AI...
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
