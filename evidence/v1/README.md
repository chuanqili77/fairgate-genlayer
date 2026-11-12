# FairGate v1 archive (superseded by v1.1)

- Contract: 0x6b42859cA5ef671F8DC27A191E450cCe8B9cAE12 (fairgate-1)
- Deploy tx: 0x61fea80782dddb0ba36846527980da80f32c062afeea8bb64c900443e5285c93
- Source SHA-256: 1d2201c7dac9385b86f5a74f711acd076c68d7cef75604cc06fd42c1b0f5cb7c (21,978 B)
- Evidence: 30 txs, all FINALIZED; verify 52/52 PASS; ledger 61 GEN in = 61 out, balance 0.
- Why superseded: v1's two events were both already settled (E1 EVENT_HELD,
  E2 CANCELLED), so the live site had no writable on-chain flow left for a
  new user — every write was blocked by the contract's status gates and the
  ticket holders were evidence-run temp accounts whose keys were deleted.
  v1.1 adds a third, live event (E3, Pentatonix, 2026-12-09, ON_SALE) on a
  new contract so the site has a real usable flow. v1 history is preserved
  here unchanged; the live submission points at the v1.1 contract.
- Files: transactions.json + deployment.json (the v1 evidence pack as run),
  EVIDENCE.md / EXPECTED.md / REVIEWER.md (the v1 docs as submitted state).
