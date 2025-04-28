---

# 📜 WHOIM V2 — Full System Specification (Self-Hostable Blockchain Identity)

---

## 🎯 Purpose

**WHOIM** empowers users to **prove account ownership** across platforms under multiple **Personas** without centralized storage.  
It uses **cryptographic proofs**, **blockchain-based record-keeping** (via **derived Solana network**), and **local-first encrypted databases** to maintain **privacy and sovereignty**.

---

## 🧩 Core Workflow

1. **Self-hosted Website** (Next.js):
   - Users create an account (Persona).
   - PGP Key generated per Persona.
   - Private data stored **locally** in an encrypted JSON file.
   - Public interactions (claims, proofs) posted to blockchain.

2. **Persona System**:
   - A User can create **multiple Personas**.
   - Each Persona manages its own:
     - Connected Accounts
     - Proof posts
     - Private meta-data (never linked across Personas).
   - System **detects and warns** if privacy leaks happen (e.g., same URL, IP hints, overlapping meta-data).

3. **Proof Creation**:
   - Sign list of connected accounts.
   - Post signed message to one account (e.g., Twitter, GitHub).
   - Submit post URL.
   - Verify and record the proof on blockchain (storing **hash only** of private part).

4. **Blockchain Interaction**:
   - Minimal data (only **hash of private JSON** and **Persona public key**) stored.
   - Any full data needed is encrypted and stored locally.
   - Anyone can **mine** (validate transactions) in the **derived Solana-like network**.

5. **Authentication System**:
   - WHOIM offers:
     - **JS script** to embed OAuth login on any website (Web3 style).
     - **No-JS fallback** with signed challenge-response over simple POST forms.

6. **Data Analytics**:
   - Local graph (using libraries like `D3.js`) that:
     - Maps account links.
     - Detects overlaps, privacy leaks.
     - Shows interaction behaviors visually like **SpiderFoot**.

---

## 🏛️ System Architecture

| Layer | Technology | Notes |
|:-----|:-----------|:------|
| Frontend | Next.js  | React server-side rendering, static export possible |
| Backend | Solana-like network | Public, decentralized blockchain for proof |
| Local Storage | JSON file encrypted with main Private Key | Stored on user device |
| Web Server | Node.js + Vercel/Local Hosting | For hosting Next.js app |
| Crypto | PGP + Blockchain Wallet | For identity signing |
| Auth API | JS Script + OAuth fallback | Interact with external sites |
| Privacy Analysis | D3.js + Local computation | Never leaks private graph data online |

---

## 📚 Local Database Model (Encrypted JSON)

### `local_storage.json`
```json
{
  "personas": [
    {
      "id": "persona_1",
      "public_key": "pgp_public_key",
      "private_data": {
        "accounts": ["twitter:@handle", "github:@username"],
        "signed_proofs": ["proof1", "proof2"],
        "notes": "any private notes"
      }
    }
  ],
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}
```
- Encrypted with the main **Private Key** (or per Persona Private Key).

---

## 🛡️ Blockchain Smart Contract Model (Solana-Derived)

| Field | Type | Description |
|:-----|:-----|:------------|
| persona_public_key | string | Public key representing a Persona |
| proof_hash | string | Hash of signed private data |
| proof_urls | array | Array of URLs where proof was posted |
| timestamp | int | Block timestamp |

---

## 🔒 Privacy Enforcement Rules

- No clear-text private data ever sent to blockchain.
- Local-first, encrypted storage.
- Auto privacy-leak detection engine:
  - Analyze persona account overlaps
  - Detect reused usernames, posts, metadata
  - Warn the user immediately if leaks are likely.

---

## 🧠 Agent System Blueprint (Prompt for Auto-Dev)

> Build a full stack system with:
> - Next.js frontend for user account/persona management.
> - JS-based OAuth login system with Web3 fallback.
> - Smart contract on a derived Solana-like network storing only proof hashes and public keys.
> - Local storage of encrypted JSON using PGP keys.
> - A privacy leak analyzer visualized using D3.js.
> - FastAPI lightweight server if needed for OAuth bridge.
> - Provide embeddable JS script for third-party OAuth integration.
> - Provide fallback minimal POST form for no-JS authentication.
> 
> Focus on modularity: blockchain, web app, local storage all independently replaceable.

---

## 📊 Example Pages (Next.js Routes)

- `/` — Landing page, onboarding
- `/dashboard` — Personas, Proofs, Privacy Warnings
- `/persona/{id}` — Persona Details, Proof Management
- `/connect` — Add account proofs
- `/graph` — SpiderFoot-style privacy map
- `/settings` — Key export, Import, Local storage config
- `/auth/callback` — OAuth handler for third-party websites

---

## 🚀 Extra Features (Stretch Goals)

- **Persona Challenge**: Users can challenge others to prove ownership on chain.
- **Key Rotation**: Allow users to update keys while keeping the same Persona.
- **Mobile-first PWA**: Support offline mode (local-first storage).
- **AI Privacy Assistant**: Recommend privacy improvements based on detected leaks.

---

# ✅ Technologies Summary

| Tech       | Usage |
|------------|-------|
| Next.js    | Frontend app |
| Node.js    | Local server for hosting |
| Solana-Fork | Blockchain |
| PostgreSQL (optional) | For optional hosted caching |
| FastAPI (optional) | OAuth proxy bridge |
| TailwindCSS | Frontend styling |
| PGPy       | Key generation / encryption |
| ethers.js/solana.js | Blockchain interaction |
| D3.js      | Graph visualization |
| Uvicorn (optional) | Local server hosting FastAPI |

---

# 🛠️ Key Ideas to Remember

- 🛡️ **Zero Knowledge** by design.
- 🔑 **Private Key is everything** (warn user to store it!).
- 🧩 **Personas are isolated** — no link except through user explicit actions.
- 🌐 **Blockchain is the backbone** — fully decentralized proof.
- 🎣 **Pluggable Auth System** — JS or No-JS.
- 🧠 **Graph-based privacy feedback** — user owns his privacy awareness.

---