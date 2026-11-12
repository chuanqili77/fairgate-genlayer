# FairGate — Reviewer pack

## Claim

FairGate sells concert tickets as on-chain stubs with a hard resale
cap (11 GEN on a 10 GEN face price) and a 10% artist royalty, and
settles escrowed ticket money by consensus on whether the show was
held, cancelled or postponed. Two real concerts, fixed in the
contract: Oasis Live '25 at Wembley (HELD) and Future & Metro Boomin
at Bridgestone Arena, Nashville (CANCELLED).

## Contract

- Address: [0x6b42859cA5ef671F8DC27A191E450cCe8B9cAE12](https://explorer-studio.genlayer.com/address/0x6b42859cA5ef671F8DC27A191E450cCe8B9cAE12)
- Deploy tx: [0x61fea807…](https://explorer-studio.genlayer.com/tx/0x61fea80782dddb0ba36846527980da80f32c062afeea8bb64c900443e5285c93)
- Source SHA-256: `1d2201c7dac9385b86f5a74f711acd076c68d7cef75604cc06fd42c1b0f5cb7c`
- Byte parity: `node scripts/byte_parity.mjs` (deployed code == repo source)

## Fastest re-check (5 minutes)

1. `node scripts/byte_parity.mjs` — deployed code matches `contracts/fairgate.py`.
2. `node scripts/verify_evidence.mjs` — re-reads every evidence transaction live and re-checks the final readback against EXPECTED.md.
3. Open the live site and wait for the FINALIZED readback: both posters show their settled verdicts, the ledger shows 61 GEN in = 61 out, balance 0.

## Anchors (the verdict reads these pages)

| Event | Source A (venue official) | Source B (independent) |
|-------|---------------------------|------------------------|
| Oasis Live '25, Wembley, 25 Jul 2025 | http://www.wembleystadium.com/events/2025/OASIS | https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/ |
| Future & Metro Boomin, Bridgestone Arena, 6 Aug 2024 | https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour | https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets |

Verdict rule (deterministic, no LLM): both sources fetched, neither
contains "cancelled"/"canceled"/"postpone"/"reschedule" → EVENT_HELD.
Both contain a cancel word → CANCELLED. Both contain a postpone word
→ POSTPONED. A fetch failure or disagreement settles nothing.

## Evidence transactions

| # | Step | Transaction |
|---|------|-------------|
| 1 | cfg-e1 | [0xaf8d6d27…](https://explorer-studio.genlayer.com/tx/0xaf8d6d271603f619572949e0f83418d71217ee3d46fc1f4024947d646ece08be) |
| 2 | cfg-e2 | [0x4ee4d3a3…](https://explorer-studio.genlayer.com/tx/0x4ee4d3a3ba46670620d6188d5de0535ef521156b1786632dc45ca3cbd854d729) |
| 3 | t1-buy | [0xd070f866…](https://explorer-studio.genlayer.com/tx/0xd070f86649550b7329aaae325ae15020f5355bfc7004459a7d6c9b494c0d3209) |
| 4 | t2-buy | [0xff6747e6…](https://explorer-studio.genlayer.com/tx/0xff6747e6b0baa63533f1ccdcf748b6b2169278ff79311e5a89dada23bb819e90) |
| 5 | t3-buy | [0xc14335c4…](https://explorer-studio.genlayer.com/tx/0xc14335c4f3edabf80256e603d8cc18adc09dec6326309c9abe5542220cd36fef) |
| 6 | t4-buy | [0xbf27644e…](https://explorer-studio.genlayer.com/tx/0xbf27644ef3dcc16afa6c7bf20cf7ee16cbf19cf5539c7bf2941fe63054d2f330) |
| 7 | r1-list | [0xbe9445f0…](https://explorer-studio.genlayer.com/tx/0xbe9445f0d69bace6bc3258a25764391accaade12314079df41182d2619f4e69c) |
| 8 | r1-buy | [0xc6e7995a…](https://explorer-studio.genlayer.com/tx/0xc6e7995a7be9730fd8dd25c31700ffa0d36651e9d70b3975249c08ee12e80e5d) |
| 9 | r2-list | [0xc5309b68…](https://explorer-studio.genlayer.com/tx/0xc5309b68589300a9afd803e27569208e7575a4c93193397b2e9ca7e8fdd3d4f6) |
| 10 | r2-buy | [0xebe8b9c9…](https://explorer-studio.genlayer.com/tx/0xebe8b9c9c05c818669e500e2f99cb62adab53fe0626bc2cf36dc09bef60a753c) |
| 11 | r3-list | [0xcecc1f77…](https://explorer-studio.genlayer.com/tx/0xcecc1f77191190d48d5e7a7be024bac88dcce45e56ea7ef9c6c6d6a20e3ad412) |
| 12 | neg3-stranger-list | [0xe5768948…](https://explorer-studio.genlayer.com/tx/0xe57689488d0594a1aa5f5d3c3611cb989ae7fcb2f73da9906a4eb2a14ce2da8b) |
| 13 | neg4-over-cap | [0xc32d2440…](https://explorer-studio.genlayer.com/tx/0xc32d2440e7de5c82346f5059b97ed8e66cd987594269d3e7608ee25cd8db310c) |
| 14 | neg6-list | [0xe6bf512a…](https://explorer-studio.genlayer.com/tx/0xe6bf512ab555e32dc5df8cc84a748975ed85ea182c41abe0b81cce88cd47437c) |
| 15 | neg6-self-buy | [0x32743a68…](https://explorer-studio.genlayer.com/tx/0x32743a68d034d0c55a66258bbb2c904274525f36096999b9ea78ef78ac91223b) |
| 16 | neg6-cancel | [0x66d02b1a…](https://explorer-studio.genlayer.com/tx/0x66d02b1aec1f4ad09f5eaa22f19891841551371199238fe1cc8401dfd74e9fd9) |
| 17 | neg5-not-listed | [0x34ad44e9…](https://explorer-studio.genlayer.com/tx/0x34ad44e9e263e6288089066d21e4725acb8d9f559dda5737330f0841051ab7ba) |
| 18 | neg2-wrong-value | [0x613e74e0…](https://explorer-studio.genlayer.com/tx/0x613e74e01139670c61f7ec98de94e15ff6cfbac6faa9a88c4135074e543fe97e) |
| 19 | neg1-unknown-event | [0xc72df404…](https://explorer-studio.genlayer.com/tx/0xc72df4044447909e3e558d112f3905a67d360706aad8835b9fa09167f7dc96b8) |
| 20 | s1-settle-e1 | [0x834b10e5…](https://explorer-studio.genlayer.com/tx/0x834b10e59ff8cd5c32879d4c5a1b540ebb1e235a59fe93e0bcdbf3e20b142403) |
| 21 | s2-settle-e2 | [0x2e7f3719…](https://explorer-studio.genlayer.com/tx/0x2e7f3719f1277a0c96cd459e43a2cd4a4c39dac6d6da676c3e45553005b50239) |
| 22 | neg9-double-settle | [0x32d8d9f3…](https://explorer-studio.genlayer.com/tx/0x32d8d9f33cadd37712919e4ce81fb22aef748df619b4b9303fa6ceb156ad4d33) |
| 23 | neg11-buy-held | [0x3c1e11db…](https://explorer-studio.genlayer.com/tx/0x3c1e11dbc5fd1eee8732bbd49768a8c5c998d1c6894949e3327d7f1c2386b757) |
| 24 | neg10-list-refunded | [0xddbcf666…](https://explorer-studio.genlayer.com/tx/0xddbcf666f6b6ccd1529e0826973b877b5278fe97ea55822c5d13da058248e67f) |
| 25 | neg7-stranger-withdraw | [0xbbf2cc24…](https://explorer-studio.genlayer.com/tx/0xbbf2cc24b4899f5cb2d1162991ebc883eb903b2d08c827802fe0acd1efce7b97) |
| 26 | w-org | [0xdd4454d5…](https://explorer-studio.genlayer.com/tx/0xdd4454d5381e85bfbcae0ae594f7e52651ba1ec9c49c7789c35321b29cd98945) |
| 27 | w-art | [0xa5cc202b…](https://explorer-studio.genlayer.com/tx/0xa5cc202b9dbf3376494f45c1984bd9bacb24f8dab2c70f1388c08670f9d9ccc6) |
| 28 | w-b1 | [0xe5e726ca…](https://explorer-studio.genlayer.com/tx/0xe5e726ca7f382a0b4a5675b9f1eef7b20dde1b4f0962bd9d6554a1c72ad8520d) |
| 29 | w-b2 | [0x30767a39…](https://explorer-studio.genlayer.com/tx/0x30767a39454a0e7be78b3b0b722c52b02e0b53adee11838080ddcdf30829b14a) |
| 30 | neg8-double-withdraw | [0x7dc21f74…](https://explorer-studio.genlayer.com/tx/0x7dc21f741285fe8cfea83e95e3e2e58f50224bc9d2bda27ce1c3a0c328a6e694) |

## Adversarial cases

See EVIDENCE.md: 11 negatives, all with exact on-chain error codes
(incl. PRICE_CAP at 12 GEN, SELF_PURCHASE, EVENT_ALREADY_SETTLED,
TICKET_NOT_ACTIVE, NO_CREDIT on double withdrawal). Failed payables
were sent with 0 GEN; final contract balance is 0 GEN.

## What this project does not prove

- No on-chain POSTPONED case in v1 (no real postponed concert with
  dual fetchable sources was found); the branch is implemented and
  mock-covered.
- The verdict reads the live pages at settlement time; if a source
  page is rewritten, the verdict follows the new text.
- Settlement is not gated on the event date (Studionet has no clock);
  both launch events already happened, so this does not affect v1.
- The on-chain ticket is a payment and settlement record, not a
  venue entry credential.
