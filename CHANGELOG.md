# Changelog

## [2026-03-16] — Frontend: wallet connect, dashboard, create wizard, vault detail
### Added
- `src/lib/wallet.ts` — wagmi config for Sepolia (injected connector + RPC transport)
- `src/hooks/useWallet.ts` — React hook: address, isConnected, connect, disconnect, switchToSepolia, isWrongNetwork
- `src/components/WalletButton.tsx` — connect/disconnect button, shows truncated address, wrong-network warning
- Wrapped App with `WagmiProvider` + wired WalletButton into Layout nav header

### Changed
- `src/pages/Dashboard.tsx` — wired to real on-chain data via `getCreatorEntries` + `getEntry` + `getEntryCount`; shows wallet-gated vault list, empty state with link to Create, live stats from Sepolia
- `src/pages/CreateWizard.tsx` — full 4-step flow: Write (name/category/context editor) → Encrypt (simulated FHE, placeholder for fhevmjs) → Upload to IPFS (via Pinata or demo CIDs) → Deploy on-chain (createEntry tx with MetaMask confirmation + Etherscan link)
- `src/pages/VaultDetail.tsx` — added wallet-signed chat (signChatAccess before messaging), access control panel (grant/revoke to any address), real on-chain entry loading, empty chat state guidance

### Dependencies
- Added `wagmi` for wallet management

---

## [2026-03-16] — Vite migration: API routes → client-side lib
### Changed
- Deleted `app/` folder (Next.js API routes incompatible with Vite)
- Created `src/lib/api.ts` — client-side chat streaming (Anthropic API direct), IPFS upload/fetch (Pinata), wallet signature verification
- Created `src/lib/contract.ts` — onchain read/write functions via viem (getEntry, hasAccess, createEntry, grantAccess, revokeAccess, logAccess, signChatAccess)

### Frontend Needs to Know
- Import from `src/lib/api.ts`: `streamChat`, `uploadToIPFS`, `fetchFromIPFS`, `verifyWalletSignature`
- Import from `src/lib/contract.ts`: `getEntry`, `hasAccess`, `createEntry`, `grantAccess`, `revokeAccess`, `logAccess`, `signChatAccess`, `getEntryCount`, `getCreatorEntries`, `waitForTransaction`
- Env vars needed: `VITE_SEPOLIA_RPC_URL`, `VITE_ANTHROPIC_API_KEY`, `VITE_PINATA_API_KEY`, `VITE_PINATA_SECRET_KEY`, `VITE_IPFS_GATEWAY` (optional)
- Chat uses `anthropic-dangerous-direct-browser-access` header — production should proxy through a backend

---

## [2026-03-16] — feat/contract (Deployment + Phase 4)
### Added
- Deployed ContextVault to Sepolia at `0xE5dc5e57db62dF4Db5E27882603686071BE1Fc76`
- `scripts/demo-vault.ts` — demo script that reads entryCount, checks access, tests grant/revoke flow
- `npm run demo:sepolia` script command
- Updated `lib/abi/ContextVault.ts` and `lib/addresses.ts` with live deployed contract data

### Verified on Sepolia
- `entryCount()` returns 0 (no entries yet — requires FHE encryption via frontend)
- `getCreatorEntries(address)` returns empty array for deployer
- Contract responds correctly to all read calls
- Entry creation requires fhevmjs for encrypted input — will be testable once frontend connects

---

## [2026-03-16] — feat/contract (Phase 2)
### Added
- `scripts/deploy.ts` — deploys ContextVault, auto-exports ABI + address to `/lib/`
- `lib/ipfs.ts` — IPFS upload/fetch via Pinata API (uploadEncrypted, fetchEncrypted, uploadMetadata)
- `lib/abi/ContextVault.ts` — placeholder ABI (overwritten on deploy)
- `lib/addresses.ts` — placeholder address (overwritten on deploy)
- `app/api/chat/route.ts` — Claude chat with signature verification + onchain ACL check, SSE streaming
- `app/api/verify/route.ts` — onchain access verification endpoint
- `app/api/upload/route.ts` — encrypted blob + metadata upload to IPFS via Pinata
- Added `@anthropic-ai/sdk` and `viem` as dependencies

### Frontend Needs to Know
- API routes are live: `POST /api/chat`, `POST /api/verify`, `POST /api/upload`
- Chat requires: `{ vaultId, decryptedContext, userMessage, history, walletAddress, signature }`
- Signature message format: `"ContextVault chat access: vault {vaultId}"`
- Upload expects base64-encoded `encryptedBytes` and JSON string `metadataJSON`
- Verify returns `{ allowed: boolean, entry: { ipfsCID, creator, createdAt, active, metadataURI } }`
- `lib/addresses.ts` has placeholder address — will update after deployment

---

## [2026-03-16] — feat/contract (Phase 1)
### Added
- Hardhat 2 dev environment with Solidity 0.8.24 compiler
- `fhevm` solidity library for FHE operations
- `contracts/ContextVault.sol` — core vault contract inheriting `SepoliaZamaFHEVMConfig`
  - Uses plaintext `ipfsCID` string + `euint256 contentHash` (fallback from ebytes64 per CLAUDE.md spec)
  - Entry CRUD: `createEntry`, `getEntry`, `getCreatorEntries`, `entryCount`
  - Access control: `grantAccess`, `revokeAccess`, `hasAccess`, `logAccess`
  - FHE ACL via `TFHE.allow` on contentHash for per-address permissions
  - Events: `EntryCreated`, `AccessGranted`, `AccessRevoked`, `VaultAccessed`
- `hardhat.config.ts` configured for Sepolia (SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY from .env.local)
- `test/ContextVault.test.ts` — 10 passing tests (ABI verification; full FHE tests require devnet)

### ABI Changes ⚠️
- New contract — no prior ABI to break. ABI will be exported to `/lib/abi/` after first deployment.

### Frontend Needs to Know
- Contract uses `string ipfsCID` (plaintext) + `euint256 contentHash` (FHE-encrypted keccak256 of CID)
- Frontend must pass `einput` + `proof` for the encrypted content hash when calling `createEntry`
- `getEntry` returns plaintext fields only (ipfsCID, creator, createdAt, active, metadataURI) — contentHash is FHE-protected
- `hasAccess(entryId, address)` is a public view for checking access without FHE
