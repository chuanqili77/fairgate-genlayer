# FairGate — Reviewer pack

## Claim

FairGate sells concert tickets as on-chain stubs with a hard resale
cap (11 GEN on a 10 GEN face price) and a 10% artist royalty, and
settles escrowed ticket money by consensus on whether the show was
held, cancelled or postponed. Three real concerts, fixed in the
contract: Oasis Live '25 at Wembley (HELD), Future & Metro Boomin
at Bridgestone Arena, Nashville (CANCELLED), and Pentatonix at
Bridgestone Arena, Nashville, 9 Dec 2026 (ON_SALE — live, unsettled).

## Contract

- Address: [0x1001588861d740A600497523C56Fe96fd425A620](https://explorer-studio.genlayer.com/address/0x1001588861d740A600497523C56Fe96fd425A620)
- Deploy tx: [0xf26a96cf…](https://explorer-studio.genlayer.com/tx/0xf26a96cf2c6c2963a31f57d92a45156a649d650305b3027bd11b5d2c5e65bee0)
- Source SHA-256: `e594e59d0cd157e22c518e19340c16ce12e27aa9ef5ea68eaa58674699ca397c`
- Byte parity: `node scripts/byte_parity.mjs` (deployed code == repo source)

## Fastest re-check (5 minutes)

1. `node scripts/byte_parity.mjs` — deployed code matches `contracts/fairgate.py`.
2. `node scripts/verify_evidence.mjs` — re-reads every evidence transaction live and re-checks the final readback against EXPECTED.md.
3. Open the live site and wait for the FINALIZED readback: the two settled posters show their verdicts, the Pentatonix poster shows ON_SALE with tickets to buy, and the ledger shows 134 GEN in, 72 GEN out, 62 GEN balance (40 GEN live E3 escrow + 22 GEN disclosed browser credits).

## Anchors (the verdict reads these pages)

| Event | Source A (venue official) | Source B (independent) |
|-------|---------------------------|------------------------|
| Oasis Live '25, Wembley, 25 Jul 2025 | http://www.wembleystadium.com/events/2025/OASIS | https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/ |
| Future & Metro Boomin, Bridgestone Arena, 6 Aug 2024 | https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour | https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets |
| Pentatonix, Bridgestone Arena, 9 Dec 2026 | https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour | https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets |

Verdict rule (deterministic, no LLM): both sources fetched, neither
contains "cancelled"/"canceled"/"postpone"/"reschedule" → EVENT_HELD.
Both contain a cancel word → CANCELLED. Both contain a postpone word
→ POSTPONED. A fetch failure or disagreement settles nothing.

## Evidence transactions

| # | Step | Transaction |
|---|------|-------------|
| 1 | cfg-e1 | [0x338cddfa…](https://explorer-studio.genlayer.com/tx/0x338cddfa7124f4d919f37965bc720b526fe3c6dd9ab1d3b4eeb77ba33a6e91c9) |
| 2 | cfg-e2 | [0xd26bb3a2…](https://explorer-studio.genlayer.com/tx/0xd26bb3a2dbaa6ee86221df8e92abf9b3d6b807e1a295a7a8ad1363abc0262277) |
| 3 | cfg-e3 | [0x783fa2fa…](https://explorer-studio.genlayer.com/tx/0x783fa2fad3f063ab70a34b54a861ff19db470cdf222a2d06ba9b4bc0cbeb4b32) |
| 4 | t1-buy | [0xebb53326…](https://explorer-studio.genlayer.com/tx/0xebb5332620e299b7aa8c966508b8b71aa889106b409da6314cd590028cd41d95) |
| 5 | t2-buy | [0xe1c40eb8…](https://explorer-studio.genlayer.com/tx/0xe1c40eb8d4a000d4f74a243cfcef5e7f99e264c6377db7fafee1455ac8749497) |
| 6 | t3-buy | [0xd3a54257…](https://explorer-studio.genlayer.com/tx/0xd3a5425741f2ac72879f8ac0fbcfc759f38c18c25ea4ffeb7bb358eb81faf680) |
| 7 | t4-buy | [0x00b8839a…](https://explorer-studio.genlayer.com/tx/0x00b8839a0c6145d5f3e148f8e18aed86e350e96029df446fa1251ebb70644f92) |
| 8 | t5-buy | [0x762dbca2…](https://explorer-studio.genlayer.com/tx/0x762dbca216b15dc340e2a8585124e5cae12f15ecc5ddf233ac744f5dda5d9356) |
| 9 | t6-buy | [0xc58eb26e…](https://explorer-studio.genlayer.com/tx/0xc58eb26ebb0f9dbdfc62c6653289282f4ef7d378c758a6550d2cf564612dab44) |
| 10 | r1-list | [0xab125a18…](https://explorer-studio.genlayer.com/tx/0xab125a180824a1f057c85d77682aa6a4c89cd2d1d17e0f50821745aa6a8d688a) |
| 11 | r1-buy | [0xb0a0b546…](https://explorer-studio.genlayer.com/tx/0xb0a0b5464e35d94aac4fd96065c1fd2002cbca294cea8147fba383dd80dc2be0) |
| 12 | r2-list | [0xcb57e69e…](https://explorer-studio.genlayer.com/tx/0xcb57e69e6bd441afed1019f17f583ad8d334daeaf613ddb7d85a2f9e8efa4bec) |
| 13 | r2-buy | [0xb9fa2e53…](https://explorer-studio.genlayer.com/tx/0xb9fa2e5334030ac22323f6552f60c7b5e369bf5d9ec65b2b67ece8370764f851) |
| 14 | r3-list | [0x97af3a2f…](https://explorer-studio.genlayer.com/tx/0x97af3a2fcd0c8fb215739053f7841379c7d9bd61d3b81dc0e306a68354b5a702) |
| 15 | r4-list | [0x8c587c2e…](https://explorer-studio.genlayer.com/tx/0x8c587c2e37bb822d9db658bea63384472701c157a5d9f896b7291e589da2efd3) |
| 16 | r4-buy | [0x6048869b…](https://explorer-studio.genlayer.com/tx/0x6048869bed809358da0fad57787b42b264dd4cab6ea6cdb97806fac6fd151d88) |
| 17 | neg3-stranger-list | [0x55067eb9…](https://explorer-studio.genlayer.com/tx/0x55067eb975caa88664592c042389b26fbd51c773d7202ca8608b5e8c198ade7e) |
| 18 | neg4-over-cap | [0x0781ef01…](https://explorer-studio.genlayer.com/tx/0x0781ef015f1bf43b80cbccf04c49f8f6c3694fda2a60b2771a5f091fb4a5b17e) |
| 19 | neg6-list | [0xeacd8d0c…](https://explorer-studio.genlayer.com/tx/0xeacd8d0cb3b294bc294b88565056307c4d6fa76051ffb08ffb05774ed734e2be) |
| 20 | neg6-self-buy | [0xf90d7002…](https://explorer-studio.genlayer.com/tx/0xf90d70026922d49b43e0b5ef562bdca2dd92b8889ab3d94fb24a28d4b3720281) |
| 21 | neg6-cancel | [0x3e8723e3…](https://explorer-studio.genlayer.com/tx/0x3e8723e3483967cb001eb1bc73fb5927513a618338eb6879e6daf2dd2c0f46bf) |
| 22 | neg5-not-listed | [0x0f25ad03…](https://explorer-studio.genlayer.com/tx/0x0f25ad034cbf8e2660ff8adc69bd2a254e74ad538dfa8f2ea282e2ab64b347d6) |
| 23 | neg2-wrong-value | [0x0b821060…](https://explorer-studio.genlayer.com/tx/0x0b82106093b523132e52e6776a471f3a5013d7a03cd0f241927ad06ae3f85ef2) |
| 24 | neg1-unknown-event | [0xad564688…](https://explorer-studio.genlayer.com/tx/0xad56468872db25d27d58fb7a4138563e9c376dc7d7989039c65b19e5a7fdc499) |
| 25 | s1-settle-e1 | [0x7a78f1d5…](https://explorer-studio.genlayer.com/tx/0x7a78f1d5a2b2a92fea9496aca18a0d345a5d3e086fa778b1000f02565b546596) |
| 26 | s2-settle-e2 | [0x2f88a746…](https://explorer-studio.genlayer.com/tx/0x2f88a746483e3404e3a9b25c66f7f93d69f3bf2ce7b38891072495c84f27a35f) |
| 27 | neg9-double-settle | [0xbb12611f…](https://explorer-studio.genlayer.com/tx/0xbb12611fef4a59d0ded065425e24010ee0621a7dfb88c716a86f6dabc8aaeb07) |
| 28 | neg11-buy-held | [0x80a7703e…](https://explorer-studio.genlayer.com/tx/0x80a7703ef65e9c82be77aabd503abb77f3ef3700fe22a7ebd7d182f10ee2100d) |
| 29 | neg10-list-refunded | [0xa8c9c4ce…](https://explorer-studio.genlayer.com/tx/0xa8c9c4cea33e2d70cede2f86596ad27a8c6ab2c56dcb38d1a7e2371604b28e4d) |
| 30 | neg7-stranger-withdraw | [0x4d83bb85…](https://explorer-studio.genlayer.com/tx/0x4d83bb85e4610f70007949758265bd70e3198f30317b29aaf190d5c33342580d) |
| 31 | w-org | [0x1148ae80…](https://explorer-studio.genlayer.com/tx/0x1148ae807b1f4ea626ffd2bd1e2cc771790d75b210a4613f18569619a24769d6) |
| 32 | w-art | [0x6ef86ca4…](https://explorer-studio.genlayer.com/tx/0x6ef86ca4704c8dec737c80ca479738b9f0dcec1826f9e78bf451f0716a82d9af) |
| 33 | w-b1 | [0xe21b89ef…](https://explorer-studio.genlayer.com/tx/0xe21b89ef48c019a54c9fc9503e8e216f1e658db0daa0dff005ee08f15a583d07) |
| 34 | w-b2 | [0xd7f9523d…](https://explorer-studio.genlayer.com/tx/0xd7f9523d5e7c76922711dfe3f874f07c4684cc6516d45e724bb49268706ea8ce) |
| 35 | neg8-double-withdraw | [0x30df9657…](https://explorer-studio.genlayer.com/tx/0x30df9657cdb6137dba88c16eb7a04fd83883312f15b68442249961a5f3a347d3) |

## Adversarial cases

See EVIDENCE.md: 11 negatives, all with exact on-chain error codes
(incl. PRICE_CAP at 12 GEN, SELF_PURCHASE, EVENT_ALREADY_SETTLED,
TICKET_NOT_ACTIVE, NO_CREDIT on double withdrawal). Failed payables
were sent with 0 GEN; the 62 GEN contract balance is E3's live
ticket escrow (40 GEN) plus 22 GEN of disclosed unwithdrawn
browser-loop credits (seller A 9.9, seller C 9.9, artist 2.2),
not stranded value.

## What this project does not prove

- No on-chain POSTPONED case in v1.1 (no real postponed concert with
  dual fetchable sources was found); the branch is implemented and
  mock-covered.
- E3 (Pentatonix, 9 Dec 2026) is not settled in this run; its verdict
  will be decided after the real date.
- The verdict reads the live pages at settlement time; if a source
  page is rewritten, the verdict follows the new text.
- Settlement is not gated on the event date (Studionet has no clock);
  E1/E2 already happened, so this does not affect them; E3 is left
  unsettled on purpose until after its real date.
- The on-chain ticket is a payment and settlement record, not a
  venue entry credential.
