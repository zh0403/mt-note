# 😈 MT Note (Mantle Transaction Note)

> "Don't let your history be MT." <

**MT Note** is a decentralized bookkeeping tool built for the Mantle Network. It allows users to attach encrypted, permanent descriptions to their on-chain transactions, solving the "What was this payment for?" problem without relying on centralized servers.

## 🏆 Mantle Hackathon 2025 Submission
**Track:** Infrastructure & Tooling

## 💥 The Problem
Blockchains are perfect ledgers for *value*, but terrible ledgers for *context*.
- You see: `Sent 50 MNT to 0x4a9...`
- You think: "Was this for rent? A loan? Or a rug pull?"
- Existing solutions (like Etherscan Private Notes) are **centralized**. If their website goes down, your data is gone. Plus, they own your data, not you.

## 💡 The Solution
**MT Note** is a browser extension that acts as a decentralized overlay for MantleScan.
1. **Write:** You add a note to a transaction hash.
2. **Encrypt:** The note is encrypted using your wallet signature (AES).
3. **Store:** The encrypted data is pinned to IPFS.
4. **Link:** The IPFS hash is stored on a Mantle Smart Contract, linked to the specific Transaction Hash.

## 🛠 Tech Stack
- **Network:** Mantle Mainnet / Sepolia
- **Storage:** IPFS (via Pinata/Web3.Storage) & Mantle Smart Contract
- **Encryption:** AES (Client-side)
- **Frontend:** Chrome Extension (Manifest V3)

## 🗺 Roadmap
- [ ] Smart Contract Deployment
- [ ] Chrome Extension UI Injection
- [ ] MetaMask Signature Integration
- [ ] IPFS Integration