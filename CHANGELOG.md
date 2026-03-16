# Changelog

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
