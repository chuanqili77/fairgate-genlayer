# FairGate — Reviewer pack

## Claim

FairGate sells concert tickets as on-chain stubs with a hard resale
cap (11 GEN on a 10 GEN face price) and a 10% artist royalty, and
settles escrowed ticket money by consensus on whether the show was
held, cancelled or postponed. Settlement is gated on an explicit
UTC timestamp per event (the first second of the day after the show
in the event's local time zone, derived by the contract from the
start timestamp and the local UTC offset). A postponed event can be
rescheduled to a later date without moving any money. Four real
concerts, fixed in the contract: Oasis Live '25 at Wembley (HELD),
Future & Metro Boomin at Bridgestone Arena, Nashville (CANCELLED),
KATSEYE at Target Center, Minneapolis (POSTPONED, rescheduled to
20 Feb 2027), and Pentatonix at Bridgestone Arena, Nashville,
9 Dec 2026 (ON_SALE — live, unsettled).

## Contract

- Address: [0x8883831222208CcbAf34DAcb8ac08f167edA6c6C](https://explorer-studio.genlayer.com/address/0x8883831222208CcbAf34DAcb8ac08f167edA6c6C)
- Deploy tx: [0xaaf1e0d5…](https://explorer-studio.genlayer.com/tx/0xaaf1e0d5764a083372676cc667eb89bc8ddefa8cd624a80866ab597841e7ef3b)
- Source SHA-256: `dfca9b07359070883cf592df0b451dd8f7f4c37ea426760f50a2d0591c8775c5`
- Byte parity: `node scripts/byte_parity.mjs` (deployed code == repo source)

## Fastest re-check (5 minutes)

1. `node scripts/byte_parity.mjs` — deployed code matches `contracts/fairgate.py`.
2. `node scripts/verify_evidence.mjs` — re-reads every evidence transaction live and re-checks the final readback against EXPECTED.md.
3. Open the live site and wait for the FINALIZED readback: the three settled posters show their verdicts, the Pentatonix poster shows ON_SALE with tickets to buy, and the ledger shows 102 GEN in, 72 GEN out, 30 GEN escrow (E3 20 live + E4 10 postponed).

## Anchors (the verdict reads these pages)

| Event | Source A (venue official) | Source B (independent) |
|-------|---------------------------|------------------------|
| Oasis Live '25, Wembley, 25 Jul 2025 | http://www.wembleystadium.com/events/2025/OASIS | https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/ |
| Future & Metro Boomin, Bridgestone Arena, 6 Aug 2024 | https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour | https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets |
| KATSEYE, Target Center, 7 Nov 2026 | https://www.targetcenter.com/events/detail/katseye | https://www.musictimes.com/articles/113245/20261109/katseye-postpone-chicago-minneapolis-shows-megan-recovers-concussion.htm |
| Pentatonix, Bridgestone Arena, 9 Dec 2026 | https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour | https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets |

Verdict rule (deterministic, no LLM): each source is read through
a scoped extractor — page title, meta content, JSON-LD structured
event data and visible body text after removing navigation,
footers, asides, scripts and recommended / related sections — so a
cancel word in a footer or a recommended article about another
event cannot flip the verdict. Each source must first confirm it
is the right event (artist + venue named in the scoped text); then
both sources fetched, neither contains
"cancelled"/"canceled"/"postpone"/"reschedule" → EVENT_HELD.
Both contain a cancel word → CANCELLED. Both contain a postpone word
→ POSTPONED. A fetch failure, a failed identity check, or
disagreement settles nothing. Settlement is also refused on-chain
before the event's settlement timestamp (transaction Unix time
compared against settle_after_ts): an early attempt fails with
TOO_EARLY.

## Evidence transactions

| # | Step | Transaction |
|---|------|-------------|
| 1 | neg0-not-creator | [0x150156b1…](https://explorer-studio.genlayer.com/tx/0x150156b116e65a728c55d6a15553cfe9256ab5128f614374690ebe39686fec96) |
| 2 | neg14-bad-address | [0x3d2f16f5…](https://explorer-studio.genlayer.com/tx/0x3d2f16f5de7434f918d6978036db650d87f53aed2fd32e5b0ee9d67e70a7f774) |
| 3 | neg15-bad-settle-after | [0xc16ddabb…](https://explorer-studio.genlayer.com/tx/0xc16ddabb2dca9e86b1771f6a2e72ec8d1c72ef9e5efdac8863d22b0729a9a63d) |
| 4 | neg16-bad-tz-offset | [0xd712503d…](https://explorer-studio.genlayer.com/tx/0xd712503d21baba85673df0d89001f294551fa11fd074544203d51e349063ffb3) |
| 5 | neg12-buy-unconfigured | [0x1a886fa5…](https://explorer-studio.genlayer.com/tx/0x1a886fa540a3eb4b19ec00f34b3eb1c63fe3353030c932b4779392e554aacab8) |
| 6 | cfg-e1 | [0xcb5d32d6…](https://explorer-studio.genlayer.com/tx/0xcb5d32d6a90f3080a88ea512089920713132b3cfe57040020c55c7b2b5866f1b) |
| 7 | cfg-e2 | [0x29b2873d…](https://explorer-studio.genlayer.com/tx/0x29b2873d390113ca4af6a5332b938fcd8c1bd0af736c19c0aecbbe9787e07235) |
| 8 | cfg-e3 | [0x47907daf…](https://explorer-studio.genlayer.com/tx/0x47907daffa2034c6f98c478614ee7a63b9e74f5f2736a94893e11ffefd156ee2) |
| 9 | cfg-e4 | [0x97362486…](https://explorer-studio.genlayer.com/tx/0x973624864f342e5b4123cde07e67920af9ec2239f6d6ceedcca8afeeeb419db5) |
| 10 | t1-buy | [0x260c8c4a…](https://explorer-studio.genlayer.com/tx/0x260c8c4a1d625390bd0537f4866542e0201a1ca54222db0a40f09fb893977e65) |
| 11 | t2-buy | [0xbba1d461…](https://explorer-studio.genlayer.com/tx/0xbba1d461205663b922a7dbc8809e72e9591abfb5c75295c0dcfeba7fa8c0dcf8) |
| 12 | t3-buy | [0x849feda3…](https://explorer-studio.genlayer.com/tx/0x849feda3b322e27a0824d35f3c2d58b4f23a7145f129d3e934ddf972b4cc8683) |
| 13 | t4-buy | [0x23e193fd…](https://explorer-studio.genlayer.com/tx/0x23e193fd191b8a443184cb315f434276107b058d2aaba4ca8f8d3f60249a98e7) |
| 14 | t5-buy | [0xabadcd70…](https://explorer-studio.genlayer.com/tx/0xabadcd706340379b64e7c5a9b8715d7e966fef33dedb54e46ce693c00a1e6db8) |
| 15 | t6-buy | [0x8979f6a8…](https://explorer-studio.genlayer.com/tx/0x8979f6a8ae336297b5cfed7ba0d954fc7a39a18b32a8c12e683b59ea80ac102e) |
| 16 | t7-buy | [0x9f7f698b…](https://explorer-studio.genlayer.com/tx/0x9f7f698b40efe177f9d448caa8667445759e8ae48cb0b67c30792c12d1a9999e) |
| 17 | r1-list | [0xdba993b1…](https://explorer-studio.genlayer.com/tx/0xdba993b18c616b410a186d662ecb0a7eacf7719b1ee4896670847db2b0cb5cb4) |
| 18 | r1-buy | [0x0ac4a01b…](https://explorer-studio.genlayer.com/tx/0x0ac4a01b8785e77ab99c82be54e70566e9a20520d308fee5c8fe7ed7ae06ddf9) |
| 19 | r2-list | [0x67997923…](https://explorer-studio.genlayer.com/tx/0x679979233b09babe02b5b7ff194af81d2028dda2ad8bc9d9bfa116f967ecf46c) |
| 20 | r2-buy | [0x993e6676…](https://explorer-studio.genlayer.com/tx/0x993e66767d889962d085d68d642404c9465e9ec1bec07c466982e5258063f251) |
| 21 | r3-list | [0xcf5314f8…](https://explorer-studio.genlayer.com/tx/0xcf5314f835e06adacf28496a11d62b1c89dbe17ba484e851033abefb2ff4919b) |
| 22 | r4-list | [0x57c99269…](https://explorer-studio.genlayer.com/tx/0x57c99269ec206e503877103292ab411bac44417c7ec271b67808c24f02ad9131) |
| 23 | r4-buy | [0x65040180…](https://explorer-studio.genlayer.com/tx/0x6504018057c8ca6d0409f1b7a024f1c926a42540f67c63bd41fb22064af745af) |
| 24 | neg3-stranger-list | [0xa3620138…](https://explorer-studio.genlayer.com/tx/0xa3620138e9167e9eab3b1c0421755b3775ea1ce9ef0579c70d588d6eb39e8d9e) |
| 25 | neg4-over-cap | [0x51065cc3…](https://explorer-studio.genlayer.com/tx/0x51065cc3907b9f699779038ed68e5c027060d24993d0eb4a6a948fa754fe5d65) |
| 26 | neg6-list | [0x84c26143…](https://explorer-studio.genlayer.com/tx/0x84c261431e47693cd81ae05764a7cb2cd5842f68ea89322d25f6e733e359a92c) |
| 27 | neg6-self-buy | [0x25d3dccc…](https://explorer-studio.genlayer.com/tx/0x25d3dcccfbb0db0392a0540d217b20bed482c7c2b4a3edd89ddd3329ec376172) |
| 28 | neg6-cancel | [0xb0fef64d…](https://explorer-studio.genlayer.com/tx/0xb0fef64d512e5d7cef20f09f11a107218133b161706c13369ddc08c84451917f) |
| 29 | neg5-not-listed | [0x2f1c47b3…](https://explorer-studio.genlayer.com/tx/0x2f1c47b39d5918d30cca83566e2fb58defeac68b20f49ca74c18b3dac0def877) |
| 30 | neg2-wrong-value | [0xb72b5a87…](https://explorer-studio.genlayer.com/tx/0xb72b5a8775f6019815cef93dabf9e7c542c154fb66460a182b6b722ec2663a5c) |
| 31 | neg1-unknown-event | [0xc297d702…](https://explorer-studio.genlayer.com/tx/0xc297d70258200f151e8ba82d87e0d639348e53901380fe0d3ec8b9a2c95ca97d) |
| 32 | neg13-early-settle-e3 | [0xb262990a…](https://explorer-studio.genlayer.com/tx/0xb262990ada7ba857f8d15d162376e34d59ca1304c6facd1ae6e3f2e0fc568c51) |
| 33 | s1-settle-e1 | [0x42939cc5…](https://explorer-studio.genlayer.com/tx/0x42939cc58d4dba64156e36ed673cb74b40415687d2b8e6314699dbcf6df1ed4f) |
| 34 | s2-settle-e2 | [0x578f3895…](https://explorer-studio.genlayer.com/tx/0x578f389519ead79f28786c5e783cb34e47dce5688ec39f12b446c7c27163b187) |
| 35 | s3-settle-e4 | [0xa525b48e…](https://explorer-studio.genlayer.com/tx/0xa525b48eae0dee915c5dcb731d747bb4550e581bb2e42660effc18f56f69b703) |
| 36 | neg18-rsch-stranger | [0x8a534add…](https://explorer-studio.genlayer.com/tx/0x8a534add11ebbc28cd452cebce6d9483a6bd537526b61e64e8fe94209cd4cd0b) |
| 37 | neg19-rsch-onsale | [0x340c12dd…](https://explorer-studio.genlayer.com/tx/0x340c12dda3cd8a41dd74e6adf59a854752b7790824b232adeebde303678bc945) |
| 38 | neg20-rsch-earlier | [0x0e76c594…](https://explorer-studio.genlayer.com/tx/0x0e76c594cc3cf77e4e5500ccd235d0d9e4cd578bbca9a5a1cec3a86e89e50b28) |
| 39 | neg21-rsch-settled-e1 | [0xa57d5899…](https://explorer-studio.genlayer.com/tx/0xa57d5899465f3c8214aa46087c6e764ffbf07d0d4f813aba4034f2778b8b56a6) |
| 40 | neg22-rsch-settled-e2 | [0xee9bfa8e…](https://explorer-studio.genlayer.com/tx/0xee9bfa8e203ee278d0630c7c10edda46204722c29ba9ff468e60e7cfff6a62d3) |
| 41 | neg23-rsch-bad-settle | [0x64ac2d8a…](https://explorer-studio.genlayer.com/tx/0x64ac2d8a512f9de490799a251db572a2f0e1e78a5f74ed0fc1cced16f2c7afca) |
| 42 | rsch1 | [0x3d55afee…](https://explorer-studio.genlayer.com/tx/0x3d55afee63ffb17f4cd35e7d578539c2e23eabdc14080ad6b67d5d430c9364ee) |
| 43 | rsch2 | [0x6542fa8d…](https://explorer-studio.genlayer.com/tx/0x6542fa8d9cf45d677b556266d70ecb0383e0c4a80fead7593a4cf3c597126354) |
| 44 | neg17-settle-after-rsch | [0x3e263e84…](https://explorer-studio.genlayer.com/tx/0x3e263e84c12c21e10fdd364dc3cedb5568ec45e0b9ce5e1735867ec121761915) |
| 45 | neg9-double-settle | [0x4bb32c5c…](https://explorer-studio.genlayer.com/tx/0x4bb32c5ccd59b88a69c75b38b642ed35114f3647940b2d46dd4f2b38a014612e) |
| 46 | neg11-buy-held | [0x5d1b2066…](https://explorer-studio.genlayer.com/tx/0x5d1b20664b8a877a13626490adc8c0a17a4662e09d3dc80e023a19f8d48c02dc) |
| 47 | neg10-list-refunded | [0xe8a4abc0…](https://explorer-studio.genlayer.com/tx/0xe8a4abc0ca18eacecb5e03c644c42a79dcafcc7a1ddc883903c185b988f28bc9) |
| 48 | neg7-stranger-withdraw | [0xba72d72a…](https://explorer-studio.genlayer.com/tx/0xba72d72a8fc962fcbd8ced6f1f7659a1224cd4d124e49f6648095c0e46dd7c25) |
| 49 | w-org | [0x265316e8…](https://explorer-studio.genlayer.com/tx/0x265316e881585c01fad78f81d8c0a4a7b51e8fe561ca0b89613b727236ac30ec) |
| 50 | w-art | [0x56650729…](https://explorer-studio.genlayer.com/tx/0x566507291ee5f32d545d5b0f61b2429ab6ab4cee6d7c9f4ed28c12e95b2972e1) |
| 51 | w-b1 | [0x4f17555d…](https://explorer-studio.genlayer.com/tx/0x4f17555d1f7cee481ea9aba6a616591ba056e6e7a29292de606091f8764f9400) |
| 52 | w-b2 | [0x60134cb1…](https://explorer-studio.genlayer.com/tx/0x60134cb15653f7a1ce2d568691c7292f0352050543d838100b1c4d969f5f24f8) |
| 53 | neg8-double-withdraw | [0xe391e084…](https://explorer-studio.genlayer.com/tx/0xe391e084538b45f70f86dbea0254e19539e78532eebc31083499a7ad544e0b67) |

## Adversarial cases

See EVIDENCE.md: 24 negatives, all with exact on-chain error codes
(incl. NOT_CREATOR on configure and on reschedule, TOO_EARLY on
early settlement, BAD_SETTLE_AFTER_TS on a wrong settlement
timestamp, BAD_TZ_OFFSET, DATE_NOT_LATER, NOT_POSTPONED on
rescheduling a settled or selling event, PRICE_CAP at 12 GEN,
SELF_PURCHASE, EVENT_ALREADY_SETTLED, TICKET_NOT_ACTIVE,
NO_CREDIT on double withdrawal). Failed payables were sent with
0 GEN; the 30 GEN contract balance is exactly the live escrow
(E3 20 + E4 10), not stranded value.

## What this project does not prove

- E3 (Pentatonix, 9 Dec 2026) is not settled in this run; its verdict
  will be decided after its settlement timestamp (2026-12-10T06:00:00Z).
  An early settlement attempt is refused on-chain (TOO_EARLY) and the
  settle button stays disabled until that timestamp.
- The verdict reads the live pages at settlement time; if a source
  page is rewritten, the verdict follows the new text.
- The on-chain ticket is a payment and settlement record, not a
  venue entry credential.
