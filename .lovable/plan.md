

# ContextVault Implementation Plan

## Overview
Build a multi-page dark-themed application called "ContextVault" — an encrypted AI context management interface. The design includes 4 distinct views connected via a shared header/nav.

## Pages to Create

1. **Home/Landing** (`/`) — Hero section, 3-step explainer cards, social proof bar
2. **Dashboard** (`/dashboard`) — Stats row (3 cards), vault card grid with hover effects
3. **Create Wizard** (`/create`) — 4-step wizard with FHE encryption animation (scrambling text, lock icon, pulsing)
4. **Vault Detail** (`/vault/:id`) — Two-column layout: left sidebar with metadata/crypto proof, right panel with AI chat interface

## Technical Approach

### Styling
- Custom CSS variables for the dark theme (--bg: #080810, --surface-1, --primary: #6366f1, etc.)
- JetBrains Mono + Inter fonts via Google Fonts
- Grid background pattern on body
- All styles via Tailwind + custom CSS in index.css

### Structure
- **Shared Layout component** with sticky header (logo + nav links)
- **4 page components** under `src/pages/`
- Routes: `/`, `/dashboard`, `/create`, `/vault/:id`
- Nav links: Home, Dashboard, Create

### Key Interactions
- Vault cards hover: translateY(-2px) + glow border
- Encryption animation: CSS keyframe `textScramble` on ciphertext
- Active badge: pulsing green dot animation
- Wizard step indicators
- Chat interface with user/agent message styles
- Collapsible sys-module headers (▼/▶)

### Files to Create/Modify
- `src/index.css` — Add custom properties, grid background, animations
- `src/components/Layout.tsx` — Shared header/nav
- `src/pages/Home.tsx` — Landing page
- `src/pages/Dashboard.tsx` — Stats + vault grid
- `src/pages/CreateWizard.tsx` — Encryption wizard
- `src/pages/VaultDetail.tsx` — Metadata + chat
- `src/App.tsx` — Add routes
- `index.html` — Add Google Fonts links

