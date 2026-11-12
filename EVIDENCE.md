# FairGate — Evidence

- Contract: [0x1001588861d740A600497523C56Fe96fd425A620](https://explorer-studio.genlayer.com/address/0x1001588861d740A600497523C56Fe96fd425A620)
- Deploy tx: [0xf26a96cf…](https://explorer-studio.genlayer.com/tx/0xf26a96cf2c6c2963a31f57d92a45156a649d650305b3027bd11b5d2c5e65bee0)
- Source SHA-256: `e594e59d0cd157e22c518e19340c16ce12e27aa9ef5ea68eaa58674699ca397c` (24144 bytes, `contracts/fairgate.py`)
- Network: GenLayer Stable Studionet (chain 61999)
- Independent verification: `node scripts/verify_evidence.mjs` — PASS (see output below)
- Mock tests: `python3 tests/test_fairgate_mock.py` — all pass

## Evidence transactions (35)

| # | Step | Transaction | Result |
|---|------|-------------|--------|
| 1 | cfg-e1 | [0x338cddfa…](https://explorer-studio.genlayer.com/tx/0x338cddfa7124f4d919f37965bc720b526fe3c6dd9ab1d3b4eeb77ba33a6e91c9) | ok |
| 2 | cfg-e2 | [0xd26bb3a2…](https://explorer-studio.genlayer.com/tx/0xd26bb3a2dbaa6ee86221df8e92abf9b3d6b807e1a295a7a8ad1363abc0262277) | ok |
| 3 | cfg-e3 | [0x783fa2fa…](https://explorer-studio.genlayer.com/tx/0x783fa2fad3f063ab70a34b54a861ff19db470cdf222a2d06ba9b4bc0cbeb4b32) | ok |
| 4 | t1-buy | [0xebb53326…](https://explorer-studio.genlayer.com/tx/0xebb5332620e299b7aa8c966508b8b71aa889106b409da6314cd590028cd41d95) | ok |
| 5 | t2-buy | [0xe1c40eb8…](https://explorer-studio.genlayer.com/tx/0xe1c40eb8d4a000d4f74a243cfcef5e7f99e264c6377db7fafee1455ac8749497) | ok |
| 6 | t3-buy | [0xd3a54257…](https://explorer-studio.genlayer.com/tx/0xd3a5425741f2ac72879f8ac0fbcfc759f38c18c25ea4ffeb7bb358eb81faf680) | ok |
| 7 | t4-buy | [0x00b8839a…](https://explorer-studio.genlayer.com/tx/0x00b8839a0c6145d5f3e148f8e18aed86e350e96029df446fa1251ebb70644f92) | ok |
| 8 | t5-buy | [0x762dbca2…](https://explorer-studio.genlayer.com/tx/0x762dbca216b15dc340e2a8585124e5cae12f15ecc5ddf233ac744f5dda5d9356) | ok |
| 9 | t6-buy | [0xc58eb26e…](https://explorer-studio.genlayer.com/tx/0xc58eb26ebb0f9dbdfc62c6653289282f4ef7d378c758a6550d2cf564612dab44) | ok |
| 10 | r1-list | [0xab125a18…](https://explorer-studio.genlayer.com/tx/0xab125a180824a1f057c85d77682aa6a4c89cd2d1d17e0f50821745aa6a8d688a) | ok |
| 11 | r1-buy | [0xb0a0b546…](https://explorer-studio.genlayer.com/tx/0xb0a0b5464e35d94aac4fd96065c1fd2002cbca294cea8147fba383dd80dc2be0) | ok |
| 12 | r2-list | [0xcb57e69e…](https://explorer-studio.genlayer.com/tx/0xcb57e69e6bd441afed1019f17f583ad8d334daeaf613ddb7d85a2f9e8efa4bec) | ok |
| 13 | r2-buy | [0xb9fa2e53…](https://explorer-studio.genlayer.com/tx/0xb9fa2e5334030ac22323f6552f60c7b5e369bf5d9ec65b2b67ece8370764f851) | ok |
| 14 | r3-list | [0x97af3a2f…](https://explorer-studio.genlayer.com/tx/0x97af3a2fcd0c8fb215739053f7841379c7d9bd61d3b81dc0e306a68354b5a702) | ok |
| 15 | r4-list | [0x8c587c2e…](https://explorer-studio.genlayer.com/tx/0x8c587c2e37bb822d9db658bea63384472701c157a5d9f896b7291e589da2efd3) | ok |
| 16 | r4-buy | [0x6048869b…](https://explorer-studio.genlayer.com/tx/0x6048869bed809358da0fad57787b42b264dd4cab6ea6cdb97806fac6fd151d88) | ok |
| 17 | neg3-stranger-list | [0x55067eb9…](https://explorer-studio.genlayer.com/tx/0x55067eb975caa88664592c042389b26fbd51c773d7202ca8608b5e8c198ade7e) | error-observed |
| 18 | neg4-over-cap | [0x0781ef01…](https://explorer-studio.genlayer.com/tx/0x0781ef015f1bf43b80cbccf04c49f8f6c3694fda2a60b2771a5f091fb4a5b17e) | error-observed |
| 19 | neg6-list | [0xeacd8d0c…](https://explorer-studio.genlayer.com/tx/0xeacd8d0cb3b294bc294b88565056307c4d6fa76051ffb08ffb05774ed734e2be) | ok |
| 20 | neg6-self-buy | [0xf90d7002…](https://explorer-studio.genlayer.com/tx/0xf90d70026922d49b43e0b5ef562bdca2dd92b8889ab3d94fb24a28d4b3720281) | error-observed |
| 21 | neg6-cancel | [0x3e8723e3…](https://explorer-studio.genlayer.com/tx/0x3e8723e3483967cb001eb1bc73fb5927513a618338eb6879e6daf2dd2c0f46bf) | ok |
| 22 | neg5-not-listed | [0x0f25ad03…](https://explorer-studio.genlayer.com/tx/0x0f25ad034cbf8e2660ff8adc69bd2a254e74ad538dfa8f2ea282e2ab64b347d6) | error-observed |
| 23 | neg2-wrong-value | [0x0b821060…](https://explorer-studio.genlayer.com/tx/0x0b82106093b523132e52e6776a471f3a5013d7a03cd0f241927ad06ae3f85ef2) | error-observed |
| 24 | neg1-unknown-event | [0xad564688…](https://explorer-studio.genlayer.com/tx/0xad56468872db25d27d58fb7a4138563e9c376dc7d7989039c65b19e5a7fdc499) | error-observed |
| 25 | s1-settle-e1 | [0x7a78f1d5…](https://explorer-studio.genlayer.com/tx/0x7a78f1d5a2b2a92fea9496aca18a0d345a5d3e086fa778b1000f02565b546596) | ok |
| 26 | s2-settle-e2 | [0x2f88a746…](https://explorer-studio.genlayer.com/tx/0x2f88a746483e3404e3a9b25c66f7f93d69f3bf2ce7b38891072495c84f27a35f) | ok |
| 27 | neg9-double-settle | [0xbb12611f…](https://explorer-studio.genlayer.com/tx/0xbb12611fef4a59d0ded065425e24010ee0621a7dfb88c716a86f6dabc8aaeb07) | error-observed |
| 28 | neg11-buy-held | [0x80a7703e…](https://explorer-studio.genlayer.com/tx/0x80a7703ef65e9c82be77aabd503abb77f3ef3700fe22a7ebd7d182f10ee2100d) | error-observed |
| 29 | neg10-list-refunded | [0xa8c9c4ce…](https://explorer-studio.genlayer.com/tx/0xa8c9c4cea33e2d70cede2f86596ad27a8c6ab2c56dcb38d1a7e2371604b28e4d) | error-observed |
| 30 | neg7-stranger-withdraw | [0x4d83bb85…](https://explorer-studio.genlayer.com/tx/0x4d83bb85e4610f70007949758265bd70e3198f30317b29aaf190d5c33342580d) | error-observed |
| 31 | w-org | [0x1148ae80…](https://explorer-studio.genlayer.com/tx/0x1148ae807b1f4ea626ffd2bd1e2cc771790d75b210a4613f18569619a24769d6) | ok |
| 32 | w-art | [0x6ef86ca4…](https://explorer-studio.genlayer.com/tx/0x6ef86ca4704c8dec737c80ca479738b9f0dcec1826f9e78bf451f0716a82d9af) | ok |
| 33 | w-b1 | [0xe21b89ef…](https://explorer-studio.genlayer.com/tx/0xe21b89ef48c019a54c9fc9503e8e216f1e658db0daa0dff005ee08f15a583d07) | ok |
| 34 | w-b2 | [0xd7f9523d…](https://explorer-studio.genlayer.com/tx/0xd7f9523d5e7c76922711dfe3f874f07c4684cc6516d45e724bb49268706ea8ce) | ok |
| 35 | neg8-double-withdraw | [0x30df9657…](https://explorer-studio.genlayer.com/tx/0x30df9657cdb6137dba88c16eb7a04fd83883312f15b68442249961a5f3a347d3) | error-observed |

## Final ledger (pre-registered in EXPECTED.md, confirmed by verify_evidence.mjs)

- 92 GEN in = 72 GEN withdrawn + 20 GEN live E3 escrow, contract balance 20 GEN
- Artist royalties paid: 3.2 GEN
- Resale volume: 32 GEN
- E1 Oasis Live '25: EVENT_HELD, 2 tickets sold, organizer paid 20 GEN
- E2 Future & Metro Boomin: CANCELLED, 2 tickets sold, both holders refunded 10 GEN each
- E3 Pentatonix, Bridgestone Arena, 9 Dec 2026: ON_SALE, 2 tickets sold, 20 GEN escrowed, NOT settled (real date in the future — the 20 GEN balance is live ticket escrow, not stranded value)
- Tickets: #1 ACTIVE (B2), #2 ACTIVE (B1), #3 REFUNDED (B1), #4 REFUNDED (B2), #5 ACTIVE (B2, E3), #6 ACTIVE (B2, E3)
- All wallet credits 0 after final withdrawals

## Adversarial cases (all on-chain)

| Case | What was tried | Expected | Observed |
|------|---------------|----------|----------|
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

## Not covered on-chain (see EXPECTED.md)

- No on-chain POSTPONED case (no real postponed concert with dual fetchable sources was found); branch implemented + mock-covered.
- UNREACHABLE / SOURCES_DISAGREE settle outcomes: fail-closed, mock-covered only.
- BAD_ADDRESS configure guard: all three events configured once at run start, error path unreachable afterwards.
- E3 settlement: E3's real date is 2026-12-09, in the future; it is not settled in this run by design. Its 20 GEN escrow stays open until after the real date.

## Browser write loop

To be recorded by the reviewer pass on the live site (buy / list /
buy-resale / settle / withdraw with transaction hashes).

## Verify output

```
PASS byte parity (deployed code == repo source)
PASS source sha matches deployment.json
PASS deploy tx recorded
PASS tx cfg-e1 FINALIZED+AGREE+SUCCESS
PASS tx cfg-e2 FINALIZED+AGREE+SUCCESS
PASS tx cfg-e3 FINALIZED+AGREE+SUCCESS
PASS tx t1-buy FINALIZED+AGREE+SUCCESS
PASS tx t2-buy FINALIZED+AGREE+SUCCESS
PASS tx t3-buy FINALIZED+AGREE+SUCCESS
PASS tx t4-buy FINALIZED+AGREE+SUCCESS
PASS tx t5-buy FINALIZED+AGREE+SUCCESS
PASS tx t6-buy FINALIZED+AGREE+SUCCESS
PASS tx r1-list FINALIZED+AGREE+SUCCESS
PASS tx r1-buy FINALIZED+AGREE+SUCCESS
PASS tx r2-list FINALIZED+AGREE+SUCCESS
PASS tx r2-buy FINALIZED+AGREE+SUCCESS
PASS tx r3-list FINALIZED+AGREE+SUCCESS
PASS tx r4-list FINALIZED+AGREE+SUCCESS
PASS tx r4-buy FINALIZED+AGREE+SUCCESS
PASS tx neg3-stranger-list FINALIZED+AGREE+ERROR with exact payload NOT_TICKET_OWNER
PASS tx neg4-over-cap FINALIZED+AGREE+ERROR with exact payload PRICE_CAP
PASS tx neg6-list FINALIZED+AGREE+SUCCESS
PASS tx neg6-self-buy FINALIZED+AGREE+ERROR with exact payload SELF_PURCHASE
PASS tx neg6-cancel FINALIZED+AGREE+SUCCESS
PASS tx neg5-not-listed FINALIZED+AGREE+ERROR with exact payload TICKET_NOT_LISTED
PASS tx neg2-wrong-value FINALIZED+AGREE+ERROR with exact payload VALUE_MUST_EQUAL_PRICE
PASS tx neg1-unknown-event FINALIZED+AGREE+ERROR with exact payload EVENT_NOT_FOUND
PASS tx s1-settle-e1 FINALIZED+AGREE+SUCCESS
PASS tx s1-settle-e1 verdict recorded as EVENT_HELD
PASS tx s2-settle-e2 FINALIZED+AGREE+SUCCESS
PASS tx s2-settle-e2 verdict recorded as CANCELLED
PASS tx neg9-double-settle FINALIZED+AGREE+ERROR with exact payload EVENT_ALREADY_SETTLED
PASS tx neg11-buy-held FINALIZED+AGREE+ERROR with exact payload EVENT_NOT_ON_SALE
PASS tx neg10-list-refunded FINALIZED+AGREE+ERROR with exact payload TICKET_NOT_ACTIVE
PASS tx neg7-stranger-withdraw FINALIZED+AGREE+ERROR with exact payload NO_CREDIT
PASS tx w-org FINALIZED+AGREE+SUCCESS
PASS tx w-art FINALIZED+AGREE+SUCCESS
PASS tx w-b1 FINALIZED+AGREE+SUCCESS
PASS tx w-b2 FINALIZED+AGREE+SUCCESS
PASS tx neg8-double-withdraw FINALIZED+AGREE+ERROR with exact payload NO_CREDIT
PASS E1 readback: EVENT_HELD, 2 sold, escrow 0, organizer paid
PASS E2 readback: CANCELLED, 2 sold, escrow 0
PASS E3 readback: ON_SALE, 2 sold, escrow 20 GEN, never settled
PASS E1 anchors are the probe-verified URLs
PASS E2 anchors are the probe-verified URLs
PASS E3 anchors are the probe-verified URLs
PASS ticket 1 readback == EXPECTED.md (ACTIVE, owner 0x1cbd…)
PASS ticket 2 readback == EXPECTED.md (ACTIVE, owner 0xf4fc…)
PASS ticket 3 readback == EXPECTED.md (REFUNDED, owner 0xf4fc…)
PASS ticket 4 readback == EXPECTED.md (REFUNDED, owner 0x1cbd…)
PASS ticket 5 readback == EXPECTED.md (ACTIVE, owner 0x1cbd…)
PASS ticket 6 readback == EXPECTED.md (ACTIVE, owner 0x1cbd…)
PASS credit P1 is 0 after withdrawals
PASS credit ORG is 0 after withdrawals
PASS credit ART is 0 after withdrawals
PASS credit B1 is 0 after withdrawals
PASS credit B2 is 0 after withdrawals
PASS credit OUT is 0 after withdrawals
PASS counts: 3 events, 6 tickets
PASS ledger: 92 GEN in, 72 out, balance 20 GEN (= E3 live escrow, not stranded), escrow 20, royalties 3.2 GEN, resale volume 32 GEN
PASS protocol is fairgate-1.1

verify: 61 PASS, 0 FAIL, 35 txs checked
INDEPENDENT VERIFICATION PASS
```
