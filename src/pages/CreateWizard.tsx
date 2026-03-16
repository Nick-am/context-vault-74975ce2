import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { uploadToIPFS } from "../lib/api";
import { createEntry, waitForTransaction } from "../lib/contract";

const wizardSteps = ["STEP 01: WRITE", "STEP 02: ENCRYPT", "STEP 03: UPLOAD", "STEP 04: DEPLOY"];

export default function CreateWizard() {
  const navigate = useNavigate();
  const { address, isConnected } = useWallet();
  const [activeStep, setActiveStep] = useState(0);

  // Step 1: Write
  const [contextText, setContextText] = useState("");
  const [vaultName, setVaultName] = useState("");
  const [category, setCategory] = useState("General");

  // Step 2: Encrypt
  const [encrypted, setEncrypted] = useState<Uint8Array | null>(null);
  const [encrypting, setEncrypting] = useState(false);

  // Step 3: Upload
  const [uploading, setUploading] = useState(false);
  const [cids, setCids] = useState<{ encryptedCID: string; metadataCID: string } | null>(null);

  // Step 4: Deploy
  const [deploying, setDeploying] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 2 handler: simulate FHE encryption (real fhevmjs would go here)
  async function handleEncrypt() {
    setEncrypting(true);
    setError(null);
    try {
      // Simulate FHE encryption delay — in production, use fhevmjs to create einput + proof
      await new Promise((r) => setTimeout(r, 1500));
      const encoder = new TextEncoder();
      const bytes = encoder.encode(contextText);
      setEncrypted(bytes);
      setActiveStep(2);
    } catch (e: any) {
      setError(e.message || "Encryption failed");
    } finally {
      setEncrypting(false);
    }
  }

  // Step 3 handler: upload to IPFS
  async function handleUpload() {
    if (!encrypted) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadToIPFS(encrypted, {
        name: vaultName || "Untitled Vault",
        description: "Encrypted context vault",
        category,
      });
      setCids(result);
      setActiveStep(3);
    } catch (e: any) {
      setError(e.message || "IPFS upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Step 4 handler: create on-chain entry
  async function handleDeploy() {
    if (!cids) return;
    setDeploying(true);
    setError(null);
    try {
      // Generate a placeholder encrypted content hash + proof
      // In production, fhevmjs would provide these from the FHE encryption step
      const contentHashPlaceholder = ("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")) as `0x${string}`;
      const proofPlaceholder = "0x00" as `0x${string}`;

      const hash = await createEntry(
        contentHashPlaceholder,
        proofPlaceholder,
        cids.encryptedCID,
        `ipfs://${cids.metadataCID}`
      );
      setTxHash(hash);
      await waitForTransaction(hash);
    } catch (e: any) {
      setError(e.message || "Transaction failed");
    } finally {
      setDeploying(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-[700px] py-20 text-center">
        <p className="font-mono text-sm text-muted-foreground">
          Connect your wallet to create a vault.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[700px] py-10">
      {/* Wizard steps */}
      <div className="relative mb-8 flex justify-between font-mono text-xs text-muted-foreground">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
        {wizardSteps.map((step, i) => (
          <span
            key={step}
            className={`relative z-10 bg-background px-4 ${
              i === activeStep ? "text-glow" : i < activeStep ? "text-emerald" : ""
            }`}
          >
            {i < activeStep ? `✓ ${step}` : step}
          </span>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-3 font-mono text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Write */}
      {activeStep === 0 && (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
            <span className="text-[8px] text-primary">▼</span>
            Context Editor
          </div>
          <div className="rounded-b-lg border border-panel-border p-4">
            <div className="mb-4">
              <label className="mb-1 block font-mono text-[11px] uppercase text-muted-foreground">Vault Name</label>
              <input
                type="text"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                placeholder="e.g., Trading Algo V2"
                className="w-full rounded-sm border border-border bg-surface1 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block font-mono text-[11px] uppercase text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-sm border border-border bg-surface1 px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option>General</option>
                <option>Finance</option>
                <option>Legal</option>
                <option>Gaming</option>
                <option>Research</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase text-muted-foreground">Context / System Prompt</label>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Enter your private context, system prompt, or knowledge base here..."
                rows={10}
                className="w-full rounded-sm border border-border bg-surface1 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                if (!contextText.trim()) {
                  setError("Please enter some context text.");
                  return;
                }
                setError(null);
                setActiveStep(1);
              }}
              className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/15 px-4 py-2 font-mono text-xs uppercase text-glow shadow-[0_0_10px_hsl(var(--primary)/0.1)] transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
            >
              Proceed to Encrypt
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Encrypt */}
      {activeStep === 1 && (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
            <span className="text-[8px] text-primary">▼</span>
            FHE Encryption Processor
          </div>
          <div className="rounded-b-lg border border-panel-border p-4">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              {encrypting ? (
                <div className="mb-6 max-h-[100px] overflow-hidden break-all font-mono text-xs leading-relaxed text-ciphertext opacity-50 animate-text-scramble">
                  0x7a6b436f6e74657874...
                  a1b2c3d4e5f60718293a...
                  fhe_payload_generating...
                  e4d3c2b1a09f8e7d6c5b...
                </div>
              ) : encrypted ? (
                <div className="mb-6 font-mono text-xs text-emerald">
                  Encrypted: {encrypted.length} bytes ready
                </div>
              ) : (
                <div className="mb-6 font-mono text-xs text-muted-foreground">
                  {contextText.length} characters ready for encryption
                </div>
              )}

              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
                <div className="relative h-6 w-5 rounded-t-[6px] border-2 border-glow">
                  <div className="absolute -left-1 bottom-[-10px] h-[14px] w-6 rounded-sm bg-glow" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
              <span className="uppercase tracking-wide text-muted-foreground">Target Entropy</span>
              <span className="min-w-[120px] rounded-sm border border-border bg-surface1 px-2 py-1 text-glow">
                256-BIT
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
              <span className="uppercase tracking-wide text-muted-foreground">Input Size</span>
              <span className="min-w-[120px] rounded-sm border border-border bg-surface1 px-2 py-1 text-glow">
                {contextText.length} CHARS
              </span>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setActiveStep(0)}
              className="rounded-sm border border-border px-4 py-2 font-mono text-xs uppercase text-muted-foreground transition-colors hover:text-foreground"
            >
              Back
            </button>
            <button
              onClick={handleEncrypt}
              disabled={encrypting}
              className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/15 px-4 py-2 font-mono text-xs uppercase text-glow shadow-[0_0_10px_hsl(var(--primary)/0.1)] transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)] disabled:opacity-50"
            >
              {encrypting ? "Encrypting..." : "Encrypt Context"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Upload to IPFS */}
      {activeStep === 2 && (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
            <span className="text-[8px] text-primary">▼</span>
            IPFS Upload
          </div>
          <div className="rounded-b-lg border border-panel-border p-4">
            <div className="flex flex-col gap-3 py-4">
              <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                <span className="uppercase tracking-wide text-muted-foreground">Encrypted Blob</span>
                <span className="text-emerald">{encrypted?.length} bytes ready</span>
              </div>
              <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                <span className="uppercase tracking-wide text-muted-foreground">Vault Name</span>
                <span className="text-glow">{vaultName || "Untitled Vault"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                <span className="uppercase tracking-wide text-muted-foreground">Category</span>
                <span className="text-glow">{category}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                <span className="uppercase tracking-wide text-muted-foreground">Destination</span>
                <span className="text-glow">PINATA / IPFS</span>
              </div>
              {cids && (
                <>
                  <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                    <span className="uppercase tracking-wide text-muted-foreground">Encrypted CID</span>
                    <span className="max-w-[250px] truncate text-emerald">{cids.encryptedCID}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                    <span className="uppercase tracking-wide text-muted-foreground">Metadata CID</span>
                    <span className="max-w-[250px] truncate text-emerald">{cids.metadataCID}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setActiveStep(1)}
              className="rounded-sm border border-border px-4 py-2 font-mono text-xs uppercase text-muted-foreground transition-colors hover:text-foreground"
            >
              Back
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/15 px-4 py-2 font-mono text-xs uppercase text-glow shadow-[0_0_10px_hsl(var(--primary)/0.1)] transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)] disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload to IPFS"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Deploy on-chain */}
      {activeStep === 3 && (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
            <span className="text-[8px] text-primary">▼</span>
            On-Chain Deployment
          </div>
          <div className="rounded-b-lg border border-panel-border p-4">
            <div className="flex flex-col gap-3 py-4">
              <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                <span className="uppercase tracking-wide text-muted-foreground">Contract</span>
                <span className="max-w-[250px] truncate text-glow">ContextVault (Sepolia)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                <span className="uppercase tracking-wide text-muted-foreground">Function</span>
                <span className="text-glow">createEntry()</span>
              </div>
              <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                <span className="uppercase tracking-wide text-muted-foreground">IPFS CID</span>
                <span className="max-w-[250px] truncate text-glow">{cids?.encryptedCID}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                <span className="uppercase tracking-wide text-muted-foreground">Wallet</span>
                <span className="text-glow">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
              {txHash && (
                <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                  <span className="uppercase tracking-wide text-muted-foreground">TX Hash</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="max-w-[250px] truncate text-emerald underline"
                  >
                    {txHash}
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            {!txHash ? (
              <>
                <button
                  onClick={() => setActiveStep(2)}
                  className="rounded-sm border border-border px-4 py-2 font-mono text-xs uppercase text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={deploying}
                  className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/15 px-4 py-2 font-mono text-xs uppercase text-glow shadow-[0_0_10px_hsl(var(--primary)/0.1)] transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)] disabled:opacity-50"
                >
                  {deploying ? "Confirming TX..." : "Deploy Vault"}
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/dashboard")}
                className="ml-auto inline-flex items-center gap-2 rounded-sm border border-emerald bg-emerald/15 px-4 py-2 font-mono text-xs uppercase text-emerald transition-all hover:bg-emerald hover:text-white"
              >
                View Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
