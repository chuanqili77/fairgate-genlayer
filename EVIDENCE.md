# FairGate — Evidence

- Contract: [0x8883831222208CcbAf34DAcb8ac08f167edA6c6C](https://explorer-studio.genlayer.com/address/0x8883831222208CcbAf34DAcb8ac08f167edA6c6C)
- Deploy tx: [0xaaf1e0d5…](https://explorer-studio.genlayer.com/tx/0xaaf1e0d5764a083372676cc667eb89bc8ddefa8cd624a80866ab597841e7ef3b)
- Source SHA-256: `dfca9b07359070883cf592df0b451dd8f7f4c37ea426760f50a2d0591c8775c5` (41041 bytes, `contracts/fairgate.py`)
- Network: GenLayer Stable Studionet (chain 61999)
- Independent verification: `node scripts/verify_evidence.mjs` — PASS (see output below)
- Mock tests: `python3 tests/test_fairgate_mock.py` — all pass

## Evidence transactions (53)

| # | Step | Transaction | Result |
|---|------|-------------|--------|
| 1 | neg0-not-creator | [0x150156b1…](https://explorer-studio.genlayer.com/tx/0x150156b116e65a728c55d6a15553cfe9256ab5128f614374690ebe39686fec96) | error-observed |
| 2 | neg14-bad-address | [0x3d2f16f5…](https://explorer-studio.genlayer.com/tx/0x3d2f16f5de7434f918d6978036db650d87f53aed2fd32e5b0ee9d67e70a7f774) | error-observed |
| 3 | neg15-bad-settle-after | [0xc16ddabb…](https://explorer-studio.genlayer.com/tx/0xc16ddabb2dca9e86b1771f6a2e72ec8d1c72ef9e5efdac8863d22b0729a9a63d) | error-observed |
| 4 | neg16-bad-tz-offset | [0xd712503d…](https://explorer-studio.genlayer.com/tx/0xd712503d21baba85673df0d89001f294551fa11fd074544203d51e349063ffb3) | error-observed |
| 5 | neg12-buy-unconfigured | [0x1a886fa5…](https://explorer-studio.genlayer.com/tx/0x1a886fa540a3eb4b19ec00f34b3eb1c63fe3353030c932b4779392e554aacab8) | error-observed |
| 6 | cfg-e1 | [0xcb5d32d6…](https://explorer-studio.genlayer.com/tx/0xcb5d32d6a90f3080a88ea512089920713132b3cfe57040020c55c7b2b5866f1b) | ok |
| 7 | cfg-e2 | [0x29b2873d…](https://explorer-studio.genlayer.com/tx/0x29b2873d390113ca4af6a5332b938fcd8c1bd0af736c19c0aecbbe9787e07235) | ok |
| 8 | cfg-e3 | [0x47907daf…](https://explorer-studio.genlayer.com/tx/0x47907daffa2034c6f98c478614ee7a63b9e74f5f2736a94893e11ffefd156ee2) | ok |
| 9 | cfg-e4 | [0x97362486…](https://explorer-studio.genlayer.com/tx/0x973624864f342e5b4123cde07e67920af9ec2239f6d6ceedcca8afeeeb419db5) | ok |
| 10 | t1-buy | [0x260c8c4a…](https://explorer-studio.genlayer.com/tx/0x260c8c4a1d625390bd0537f4866542e0201a1ca54222db0a40f09fb893977e65) | ok |
| 11 | t2-buy | [0xbba1d461…](https://explorer-studio.genlayer.com/tx/0xbba1d461205663b922a7dbc8809e72e9591abfb5c75295c0dcfeba7fa8c0dcf8) | ok |
| 12 | t3-buy | [0x849feda3…](https://explorer-studio.genlayer.com/tx/0x849feda3b322e27a0824d35f3c2d58b4f23a7145f129d3e934ddf972b4cc8683) | ok |
| 13 | t4-buy | [0x23e193fd…](https://explorer-studio.genlayer.com/tx/0x23e193fd191b8a443184cb315f434276107b058d2aaba4ca8f8d3f60249a98e7) | ok |
| 14 | t5-buy | [0xabadcd70…](https://explorer-studio.genlayer.com/tx/0xabadcd706340379b64e7c5a9b8715d7e966fef33dedb54e46ce693c00a1e6db8) | ok |
| 15 | t6-buy | [0x8979f6a8…](https://explorer-studio.genlayer.com/tx/0x8979f6a8ae336297b5cfed7ba0d954fc7a39a18b32a8c12e683b59ea80ac102e) | ok |
| 16 | t7-buy | [0x9f7f698b…](https://explorer-studio.genlayer.com/tx/0x9f7f698b40efe177f9d448caa8667445759e8ae48cb0b67c30792c12d1a9999e) | ok |
| 17 | r1-list | [0xdba993b1…](https://explorer-studio.genlayer.com/tx/0xdba993b18c616b410a186d662ecb0a7eacf7719b1ee4896670847db2b0cb5cb4) | ok |
| 18 | r1-buy | [0x0ac4a01b…](https://explorer-studio.genlayer.com/tx/0x0ac4a01b8785e77ab99c82be54e70566e9a20520d308fee5c8fe7ed7ae06ddf9) | ok |
| 19 | r2-list | [0x67997923…](https://explorer-studio.genlayer.com/tx/0x679979233b09babe02b5b7ff194af81d2028dda2ad8bc9d9bfa116f967ecf46c) | ok |
| 20 | r2-buy | [0x993e6676…](https://explorer-studio.genlayer.com/tx/0x993e66767d889962d085d68d642404c9465e9ec1bec07c466982e5258063f251) | ok |
| 21 | r3-list | [0xcf5314f8…](https://explorer-studio.genlayer.com/tx/0xcf5314f835e06adacf28496a11d62b1c89dbe17ba484e851033abefb2ff4919b) | ok |
| 22 | r4-list | [0x57c99269…](https://explorer-studio.genlayer.com/tx/0x57c99269ec206e503877103292ab411bac44417c7ec271b67808c24f02ad9131) | ok |
| 23 | r4-buy | [0x65040180…](https://explorer-studio.genlayer.com/tx/0x6504018057c8ca6d0409f1b7a024f1c926a42540f67c63bd41fb22064af745af) | ok |
| 24 | neg3-stranger-list | [0xa3620138…](https://explorer-studio.genlayer.com/tx/0xa3620138e9167e9eab3b1c0421755b3775ea1ce9ef0579c70d588d6eb39e8d9e) | error-observed |
| 25 | neg4-over-cap | [0x51065cc3…](https://explorer-studio.genlayer.com/tx/0x51065cc3907b9f699779038ed68e5c027060d24993d0eb4a6a948fa754fe5d65) | error-observed |
| 26 | neg6-list | [0x84c26143…](https://explorer-studio.genlayer.com/tx/0x84c261431e47693cd81ae05764a7cb2cd5842f68ea89322d25f6e733e359a92c) | ok |
| 27 | neg6-self-buy | [0x25d3dccc…](https://explorer-studio.genlayer.com/tx/0x25d3dcccfbb0db0392a0540d217b20bed482c7c2b4a3edd89ddd3329ec376172) | error-observed |
| 28 | neg6-cancel | [0xb0fef64d…](https://explorer-studio.genlayer.com/tx/0xb0fef64d512e5d7cef20f09f11a107218133b161706c13369ddc08c84451917f) | ok |
| 29 | neg5-not-listed | [0x2f1c47b3…](https://explorer-studio.genlayer.com/tx/0x2f1c47b39d5918d30cca83566e2fb58defeac68b20f49ca74c18b3dac0def877) | error-observed |
| 30 | neg2-wrong-value | [0xb72b5a87…](https://explorer-studio.genlayer.com/tx/0xb72b5a8775f6019815cef93dabf9e7c542c154fb66460a182b6b722ec2663a5c) | error-observed |
| 31 | neg1-unknown-event | [0xc297d702…](https://explorer-studio.genlayer.com/tx/0xc297d70258200f151e8ba82d87e0d639348e53901380fe0d3ec8b9a2c95ca97d) | error-observed |
| 32 | neg13-early-settle-e3 | [0xb262990a…](https://explorer-studio.genlayer.com/tx/0xb262990ada7ba857f8d15d162376e34d59ca1304c6facd1ae6e3f2e0fc568c51) | error-observed |
| 33 | s1-settle-e1 | [0x42939cc5…](https://explorer-studio.genlayer.com/tx/0x42939cc58d4dba64156e36ed673cb74b40415687d2b8e6314699dbcf6df1ed4f) | ok |
| 34 | s2-settle-e2 | [0x578f3895…](https://explorer-studio.genlayer.com/tx/0x578f389519ead79f28786c5e783cb34e47dce5688ec39f12b446c7c27163b187) | ok |
| 35 | s3-settle-e4 | [0xa525b48e…](https://explorer-studio.genlayer.com/tx/0xa525b48eae0dee915c5dcb731d747bb4550e581bb2e42660effc18f56f69b703) | ok |
| 36 | neg18-rsch-stranger | [0x8a534add…](https://explorer-studio.genlayer.com/tx/0x8a534add11ebbc28cd452cebce6d9483a6bd537526b61e64e8fe94209cd4cd0b) | error-observed |
| 37 | neg19-rsch-onsale | [0x340c12dd…](https://explorer-studio.genlayer.com/tx/0x340c12dda3cd8a41dd74e6adf59a854752b7790824b232adeebde303678bc945) | error-observed |
| 38 | neg20-rsch-earlier | [0x0e76c594…](https://explorer-studio.genlayer.com/tx/0x0e76c594cc3cf77e4e5500ccd235d0d9e4cd578bbca9a5a1cec3a86e89e50b28) | error-observed |
| 39 | neg21-rsch-settled-e1 | [0xa57d5899…](https://explorer-studio.genlayer.com/tx/0xa57d5899465f3c8214aa46087c6e764ffbf07d0d4f813aba4034f2778b8b56a6) | error-observed |
| 40 | neg22-rsch-settled-e2 | [0xee9bfa8e…](https://explorer-studio.genlayer.com/tx/0xee9bfa8e203ee278d0630c7c10edda46204722c29ba9ff468e60e7cfff6a62d3) | error-observed |
| 41 | neg23-rsch-bad-settle | [0x64ac2d8a…](https://explorer-studio.genlayer.com/tx/0x64ac2d8a512f9de490799a251db572a2f0e1e78a5f74ed0fc1cced16f2c7afca) | error-observed |
| 42 | rsch1 | [0x3d55afee…](https://explorer-studio.genlayer.com/tx/0x3d55afee63ffb17f4cd35e7d578539c2e23eabdc14080ad6b67d5d430c9364ee) | ok |
| 43 | rsch2 | [0x6542fa8d…](https://explorer-studio.genlayer.com/tx/0x6542fa8d9cf45d677b556266d70ecb0383e0c4a80fead7593a4cf3c597126354) | ok |
| 44 | neg17-settle-after-rsch | [0x3e263e84…](https://explorer-studio.genlayer.com/tx/0x3e263e84c12c21e10fdd364dc3cedb5568ec45e0b9ce5e1735867ec121761915) | error-observed |
| 45 | neg9-double-settle | [0x4bb32c5c…](https://explorer-studio.genlayer.com/tx/0x4bb32c5ccd59b88a69c75b38b642ed35114f3647940b2d46dd4f2b38a014612e) | error-observed |
| 46 | neg11-buy-held | [0x5d1b2066…](https://explorer-studio.genlayer.com/tx/0x5d1b20664b8a877a13626490adc8c0a17a4662e09d3dc80e023a19f8d48c02dc) | error-observed |
| 47 | neg10-list-refunded | [0xe8a4abc0…](https://explorer-studio.genlayer.com/tx/0xe8a4abc0ca18eacecb5e03c644c42a79dcafcc7a1ddc883903c185b988f28bc9) | error-observed |
| 48 | neg7-stranger-withdraw | [0xba72d72a…](https://explorer-studio.genlayer.com/tx/0xba72d72a8fc962fcbd8ced6f1f7659a1224cd4d124e49f6648095c0e46dd7c25) | error-observed |
| 49 | w-org | [0x265316e8…](https://explorer-studio.genlayer.com/tx/0x265316e881585c01fad78f81d8c0a4a7b51e8fe561ca0b89613b727236ac30ec) | ok |
| 50 | w-art | [0x56650729…](https://explorer-studio.genlayer.com/tx/0x566507291ee5f32d545d5b0f61b2429ab6ab4cee6d7c9f4ed28c12e95b2972e1) | ok |
| 51 | w-b1 | [0x4f17555d…](https://explorer-studio.genlayer.com/tx/0x4f17555d1f7cee481ea9aba6a616591ba056e6e7a29292de606091f8764f9400) | ok |
| 52 | w-b2 | [0x60134cb1…](https://explorer-studio.genlayer.com/tx/0x60134cb15653f7a1ce2d568691c7292f0352050543d838100b1c4d969f5f24f8) | ok |
| 53 | neg8-double-withdraw | [0xe391e084…](https://explorer-studio.genlayer.com/tx/0xe391e084538b45f70f86dbea0254e19539e78532eebc31083499a7ad544e0b67) | error-observed |

## Final ledger (pre-registered in EXPECTED.md, confirmed by verify_evidence.mjs)

- 102 GEN in = 72 GEN withdrawn + 30 GEN escrow (E3 20 + E4 10), contract balance 30 GEN
- Artist royalties paid: 3.2 GEN
- Resale volume: 32 GEN
- E1 Oasis Live '25: EVENT_HELD, 2 tickets sold, organizer paid 20 GEN
- E2 Future & Metro Boomin: CANCELLED, 2 tickets sold, both holders refunded the 10 GEN face price each (a resale buyer who paid 11 GEN gets 10 back)
- E3 Pentatonix, Bridgestone Arena, 9 Dec 2026 19:00 Nashville: ON_SALE, 2 tickets sold, 20 GEN escrowed, NOT settled (settlement timestamp 2026-12-10T06:00:00Z is in the future — the 20 GEN balance is live ticket escrow, not stranded value; an early settlement attempt was refused on-chain, neg13 TOO_EARLY)
- E4 KATSEYE, Target Center, 7 Nov 2026: POSTPONED, 1 ticket sold, 10 GEN escrowed, settled once on-chain (settle_count 1), then rescheduled twice (2027-01-16, then 2027-02-20) — each reschedule kept the ticket, the holder and the 10 GEN escrow untouched and moved no money
- Tickets: #1 ACTIVE (B2), #2 ACTIVE (B1), #3 REFUNDED (B1), #4 REFUNDED (B2), #5 ACTIVE (B2, E3), #6 ACTIVE (B2, E3), #7 ACTIVE (B1, E4)
- All wallet credits 0 after final withdrawals

## Adversarial cases (all on-chain)

| Case | What was tried | Expected | Observed |
|------|---------------|----------|----------|
| neg0 | OUT configures event 1 (not the creator) | NOT_CREATOR | error |
| neg14 | P1 configures with a malformed address | BAD_ADDRESS | error |
| neg12 | buy E1 before any event is configured | EVENT_NOT_CONFIGURED | error, 0 GEN sent |
| neg1 | buy event 99 | EVENT_NOT_FOUND | error, 0 GEN sent |
| neg2 | buy E1 with 0 GEN | VALUE_MUST_EQUAL_PRICE | error, 0 GEN sent |
| neg3 | B2 lists T2 owned by B1 | NOT_TICKET_OWNER | error |
| neg4 | list T1 at 12 GEN (above 11 cap) | PRICE_CAP | error |
| neg5 | buy resale of unlisted T4 | TICKET_NOT_LISTED | error |
| neg6 | B1 buys own T2 listing | SELF_PURCHASE | error, then listing cancelled |
| neg7 | OUT withdraws with no credit | NO_CREDIT | error |
| neg8 | ORG withdraws twice | NO_CREDIT | error |
| neg9 | settle E1 twice | EVENT_ALREADY_SETTLED | error |
| neg10 | list REFUNDED T3 | TICKET_NOT_ACTIVE | error |
| neg11 | buy E1 after settlement | EVENT_NOT_ON_SALE | error, 0 GEN sent |
| neg13 | settle E3 before its settlement timestamp (2026-11-12 < 2026-12-10T06:00:00Z) | TOO_EARLY | error, state unchanged |
| neg15 | configure E1 with a settlement timestamp 1 hour late | BAD_SETTLE_AFTER_TS | error |
| neg16 | configure E1 with an out-of-range UTC offset (9999) | BAD_TZ_OFFSET | error |
| neg18 | OUT reschedules E4 (not the creator) | NOT_CREATOR | error |
| neg19 | P1 reschedules E3 (ON_SALE, not postponed) | NOT_POSTPONED | error |
| neg20 | P1 reschedules E4 to an earlier date (2026-11-01) | DATE_NOT_LATER | error |
| neg21 | P1 reschedules E1 (already HELD) | NOT_POSTPONED | error |
| neg22 | P1 reschedules E2 (already CANCELLED) | NOT_POSTPONED | error |
| neg23 | P1 reschedules E4 with a settlement timestamp 1 second late | BAD_SETTLE_AFTER_TS | error |
| neg17 | settle E4 after rescheduling (before the new 2027-02-21T06:00:00Z timestamp) | TOO_EARLY | error, state unchanged |

## Not covered on-chain (see EXPECTED.md)

- SOLD_OUT: no on-chain case (buying all 8 E3 tickets would close the live site's only buyable event); branch implemented + mock-covered.
- UNREACHABLE / SOURCES_DISAGREE settle outcomes: fail-closed, mock-covered only.
- E3 settlement: E3's real date is 2026-12-09 19:00 Nashville, in the future. It is not settled in this run by design; an early attempt is refused on-chain (neg13, TOO_EARLY). Its 20 GEN escrow stays open until its settlement timestamp (2026-12-10T06:00:00Z). The organizer key is retained offline by the project operator (never committed) so the organizer credit can be withdrawn after that settlement.

## Browser write loop

To be recorded on the live site (buy / list / buy-resale /
seller withdraw / artist withdraw with transaction hashes) in
docs/browser-transactions.json; this file is re-generated after
the loop runs.


## Verify output

```
PASS byte parity (deployed code == repo source)
PASS source sha matches deployment.json
PASS deploy tx recorded
PASS evidence file names the deployed contract
PASS tx neg0-not-creator (scripted) FINALIZED+AGREE+ERROR with exact payload NOT_CREATOR
PASS tx neg14-bad-address (scripted) FINALIZED+AGREE+ERROR with exact payload BAD_ADDRESS
PASS tx neg15-bad-settle-after (scripted) FINALIZED+AGREE+ERROR with exact payload BAD_SETTLE_AFTER_TS
PASS tx neg16-bad-tz-offset (scripted) FINALIZED+AGREE+ERROR with exact payload BAD_TZ_OFFSET
PASS tx neg12-buy-unconfigured (scripted) FINALIZED+AGREE+ERROR with exact payload EVENT_NOT_CONFIGURED
PASS tx cfg-e1 (scripted) FINALIZED+AGREE+SUCCESS
PASS tx cfg-e2 (scripted) FINALIZED+AGREE+SUCCESS
PASS tx cfg-e3 (scripted) FINALIZED+AGREE+SUCCESS
PASS tx cfg-e4 (scripted) FINALIZED+AGREE+SUCCESS
PASS tx t1-buy (scripted) FINALIZED+AGREE+SUCCESS
PASS tx t2-buy (scripted) FINALIZED+AGREE+SUCCESS
PASS tx t3-buy (scripted) FINALIZED+AGREE+SUCCESS
PASS tx t4-buy (scripted) FINALIZED+AGREE+SUCCESS
PASS tx t5-buy (scripted) FINALIZED+AGREE+SUCCESS
PASS tx t6-buy (scripted) FINALIZED+AGREE+SUCCESS
PASS tx t7-buy (scripted) FINALIZED+AGREE+SUCCESS
PASS tx r1-list (scripted) FINALIZED+AGREE+SUCCESS
PASS tx r1-buy (scripted) FINALIZED+AGREE+SUCCESS
PASS tx r2-list (scripted) FINALIZED+AGREE+SUCCESS
PASS tx r2-buy (scripted) FINALIZED+AGREE+SUCCESS
PASS tx r3-list (scripted) FINALIZED+AGREE+SUCCESS
PASS tx r4-list (scripted) FINALIZED+AGREE+SUCCESS
PASS tx r4-buy (scripted) FINALIZED+AGREE+SUCCESS
PASS tx neg3-stranger-list (scripted) FINALIZED+AGREE+ERROR with exact payload NOT_TICKET_OWNER
PASS tx neg4-over-cap (scripted) FINALIZED+AGREE+ERROR with exact payload PRICE_CAP
PASS tx neg6-list (scripted) FINALIZED+AGREE+SUCCESS
PASS tx neg6-self-buy (scripted) FINALIZED+AGREE+ERROR with exact payload SELF_PURCHASE
PASS tx neg6-cancel (scripted) FINALIZED+AGREE+SUCCESS
PASS tx neg5-not-listed (scripted) FINALIZED+AGREE+ERROR with exact payload TICKET_NOT_LISTED
PASS tx neg2-wrong-value (scripted) FINALIZED+AGREE+ERROR with exact payload VALUE_MUST_EQUAL_PRICE
PASS tx neg1-unknown-event (scripted) FINALIZED+AGREE+ERROR with exact payload EVENT_NOT_FOUND
PASS tx neg13-early-settle-e3 (scripted) FINALIZED+AGREE+ERROR with exact payload TOO_EARLY
PASS tx s1-settle-e1 (scripted) FINALIZED+AGREE+SUCCESS
PASS tx s1-settle-e1 verdict recorded as EVENT_HELD
PASS tx s2-settle-e2 (scripted) FINALIZED+AGREE+SUCCESS
PASS tx s2-settle-e2 verdict recorded as CANCELLED
PASS tx s3-settle-e4 (scripted) FINALIZED+AGREE+SUCCESS
PASS tx s3-settle-e4 verdict recorded as POSTPONED
PASS tx neg18-rsch-stranger (scripted) FINALIZED+AGREE+ERROR with exact payload NOT_CREATOR
PASS tx neg19-rsch-onsale (scripted) FINALIZED+AGREE+ERROR with exact payload NOT_POSTPONED
PASS tx neg20-rsch-earlier (scripted) FINALIZED+AGREE+ERROR with exact payload DATE_NOT_LATER
PASS tx neg21-rsch-settled-e1 (scripted) FINALIZED+AGREE+ERROR with exact payload NOT_POSTPONED
PASS tx neg22-rsch-settled-e2 (scripted) FINALIZED+AGREE+ERROR with exact payload NOT_POSTPONED
PASS tx neg23-rsch-bad-settle (scripted) FINALIZED+AGREE+ERROR with exact payload BAD_SETTLE_AFTER_TS
PASS tx rsch1 (scripted) FINALIZED+AGREE+SUCCESS
PASS tx rsch2 (scripted) FINALIZED+AGREE+SUCCESS
PASS tx neg17-settle-after-rsch (scripted) FINALIZED+AGREE+ERROR with exact payload TOO_EARLY
PASS tx neg9-double-settle (scripted) FINALIZED+AGREE+ERROR with exact payload EVENT_ALREADY_SETTLED
PASS tx neg11-buy-held (scripted) FINALIZED+AGREE+ERROR with exact payload EVENT_NOT_ON_SALE
PASS tx neg10-list-refunded (scripted) FINALIZED+AGREE+ERROR with exact payload TICKET_NOT_ACTIVE
PASS tx neg7-stranger-withdraw (scripted) FINALIZED+AGREE+ERROR with exact payload NO_CREDIT
PASS tx w-org (scripted) FINALIZED+AGREE+SUCCESS
PASS tx w-art (scripted) FINALIZED+AGREE+SUCCESS
PASS tx w-b1 (scripted) FINALIZED+AGREE+SUCCESS
PASS tx w-b2 (scripted) FINALIZED+AGREE+SUCCESS
PASS tx neg8-double-withdraw (scripted) FINALIZED+AGREE+ERROR with exact payload NO_CREDIT

browser write loop: not yet run — scripted checks above are the complete result for now
PASS E1 readback: EVENT_HELD, 2 sold, escrow 0, organizer paid, timestamps stored
PASS E2 readback: CANCELLED, 2 sold, escrow 0, timestamps stored
PASS E4 readback: POSTPONED, 1 sold, escrow 10 GEN, rescheduled to 2027-02-20, settle_count 1
PASS E1 anchors are the probe-verified URLs
PASS E2 anchors are the probe-verified URLs
PASS E3 anchors are the probe-verified URLs
PASS E4 anchors are the probe-verified URLs
PASS E1 identity tokens are oasis + wembley
PASS E2 identity tokens are metro boomin + bridgestone
PASS E3 identity tokens are pentatonix + bridgestone
PASS E4 identity tokens are katseye + target center
PASS E3 timestamps: start 2026-12-09 19:00 CST, settle_after 2026-12-10T06:00:00Z
PASS creator is the deployer P1
PASS ticket 1 readback == EXPECTED.md (ACTIVE, owner 0x0d4b…)
PASS ticket 2 readback == EXPECTED.md (ACTIVE, owner 0xc2c6…)
PASS ticket 3 readback == EXPECTED.md (REFUNDED, owner 0xc2c6…)
PASS ticket 4 readback == EXPECTED.md (REFUNDED, owner 0x0d4b…)
PASS ticket 5 readback == EXPECTED.md (ACTIVE, owner 0x0d4b…)
PASS ticket 6 readback == EXPECTED.md (ACTIVE, owner 0x0d4b…)
PASS ticket 7 readback == EXPECTED.md (ACTIVE, owner 0xc2c6…)
PASS credit P1 is 0 after withdrawals
PASS credit ORG is 0 after withdrawals
PASS credit ART is 0 after withdrawals
PASS credit B1 is 0 after withdrawals
PASS credit B2 is 0 after withdrawals
PASS credit OUT is 0 after withdrawals
PASS E3 readback (scripted): ON_SALE, 2 sold, escrow 20 GEN, never settled
PASS counts (scripted): 4 events, 7 tickets
PASS ledger (scripted): 102 GEN in, 72 out, balance 30 GEN (= E3 20 + E4 10 escrow), escrow 30, royalties 3.2 GEN, resale volume 32 GEN
PASS protocol is fairgate-1.3

verify: 90 PASS, 0 FAIL, 53 scripted txs + 0 browser txs checked
INDEPENDENT VERIFICATION PASS
```
