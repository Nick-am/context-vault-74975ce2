import { useState } from "react";

const wizardSteps = ["STEP 01: WRITE", "STEP 02: ENCRYPT", "STEP 03: UPLOAD", "STEP 04: ACCESS"];

export default function CreateWizard() {
  const [activeStep, setActiveStep] = useState(1); // 0-indexed but display shows step 2 active

  return (
    <div className="mx-auto max-w-[700px] py-10">
      {/* Wizard steps */}
      <div className="relative mb-8 flex justify-between font-mono text-xs text-muted-foreground">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
        {wizardSteps.map((step, i) => (
          <span
            key={step}
            onClick={() => setActiveStep(i)}
            className={`relative z-10 cursor-pointer bg-background px-4 ${
              i === activeStep ? "text-glow" : ""
            }`}
          >
            {step}
          </span>
        ))}
      </div>

      {/* Encryption panel */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2 rounded-t-lg bg-secondary px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-glow">
          <span className="text-[8px] text-primary">▼</span>
          FHE Encryption Processor
        </div>
        <div className="rounded-b-lg border border-panel-border p-4">
          {/* Encryption animation area */}
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {/* Scramble text */}
            <div className="mb-6 max-h-[100px] overflow-hidden break-all font-mono text-xs leading-relaxed text-ciphertext opacity-50 animate-text-scramble">
              0x7a6b436f6e74657874...
              a1b2c3d4e5f60718293a...
              fhe_payload_generating...
              e4d3c2b1a09f8e7d6c5b...
            </div>

            {/* Lock icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
              <div className="relative h-6 w-5 rounded-t-[6px] border-2 border-glow">
                <div className="absolute -left-1 bottom-[-10px] h-[14px] w-6 rounded-sm bg-glow" />
              </div>
            </div>
          </div>

          {/* Target entropy row */}
          <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
            <span className="uppercase tracking-wide text-muted-foreground">Target Entropy</span>
            <span className="min-w-[120px] rounded-sm border border-border bg-surface1 px-2 py-1 text-glow">
              256-BIT
            </span>
          </div>
        </div>
      </div>

      {/* Proceed button */}
      <div className="mt-6 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/15 px-4 py-2 font-mono text-xs uppercase text-glow shadow-[0_0_10px_hsl(var(--primary)/0.1)] transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
          Proceed [Enter]
        </button>
      </div>
    </div>
  );
}
