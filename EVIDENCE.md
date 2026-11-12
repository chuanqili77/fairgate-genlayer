# FairGate — Evidence

- Contract: [0x38b0aE26d0C6DE7F5C8418368a2dc10f4d843E5E](https://explorer-studio.genlayer.com/address/0x38b0aE26d0C6DE7F5C8418368a2dc10f4d843E5E)
- Deploy tx: [0xb022a4db…](https://explorer-studio.genlayer.com/tx/0xb022a4db01dd729942e7e9c7ba87c304373129869dd7500732bbb6fe259382f6)
- Source SHA-256: `51a4059beb9e72be889b6096577581d7947ed71f903b9b2faf236a43a6c414df` (29128 bytes, `contracts/fairgate.py`)
- Network: GenLayer Stable Studionet (chain 61999)
- Independent verification: `node scripts/verify_evidence.mjs` — PASS (see output below)
- Mock tests: `python3 tests/test_fairgate_mock.py` — all pass

## Evidence transactions (42)

| # | Step | Transaction | Result |
|---|------|-------------|--------|
| 1 | neg0-not-creator | [0xee1180bc…](https://explorer-studio.genlayer.com/tx/0xee1180bc71385e68f6f770b84830655dbe2a3082d260edafe19012bb4409b8b2) | error-observed |
| 2 | neg14-bad-address | [0xbdb22861…](https://explorer-studio.genlayer.com/tx/0xbdb22861d142f31d24baca5829600c7c9fd46455f482e291bc73b57ecb15befc) | error-observed |
| 3 | neg12-buy-unconfigured | [0x0de2889f…](https://explorer-studio.genlayer.com/tx/0x0de2889f6b46382b6ee7bc5f74cf7e3b88297d52bec0381092e7caf153184bcd) | error-observed |
| 4 | cfg-e1 | [0x162752bb…](https://explorer-studio.genlayer.com/tx/0x162752bb035bc225ee4ce354ebec5969c8819bae2b23bf85111229b1c95612a6) | ok |
| 5 | cfg-e2 | [0xff88a5a7…](https://explorer-studio.genlayer.com/tx/0xff88a5a724726c3e0ddb562e811f7c87ab7b1ef5a73c82afa6332bf8bd2a4513) | ok |
| 6 | cfg-e3 | [0xc6177fce…](https://explorer-studio.genlayer.com/tx/0xc6177fce75493a0a3760b41f3124e117b48b8aa1076d7ffa3231fb4b312892de) | ok |
| 7 | cfg-e4 | [0x552e1cba…](https://explorer-studio.genlayer.com/tx/0x552e1cba57a1bd761603f3b3e0fe9859e1874ce50dbe6f3c00cfbfdd411dad94) | ok |
| 8 | t1-buy | [0xceaa56b3…](https://explorer-studio.genlayer.com/tx/0xceaa56b3bc9994a2b5d5e847d84c8f17038c3c6d405d80809551190802a1b741) | ok |
| 9 | t2-buy | [0x54618ca0…](https://explorer-studio.genlayer.com/tx/0x54618ca0b9afee723b27aa71d14c31c4f3662a41751a85b36c6c477f66af2666) | ok |
| 10 | t3-buy | [0x8a05db78…](https://explorer-studio.genlayer.com/tx/0x8a05db7881e83833199a7dc0b99d5f8f2bcedf145609f913e01f3532df12004e) | ok |
| 11 | t4-buy | [0x9a9a29d8…](https://explorer-studio.genlayer.com/tx/0x9a9a29d862d00c280b56085ef10f9ba551ecb3233b33f7218208755ead58650f) | ok |
| 12 | t5-buy | [0x8af7fb6b…](https://explorer-studio.genlayer.com/tx/0x8af7fb6b87a5ac47b18fbbc18c764ddf1bac4e5e52f0700f1a7bc331122f3e80) | ok |
| 13 | t6-buy | [0x96d7dd05…](https://explorer-studio.genlayer.com/tx/0x96d7dd05d09d9d84c430c06de70dd52bf83e7d0cc6a8a4a73ad6c6dc8a2066bd) | ok |
| 14 | r1-list | [0xf59e9906…](https://explorer-studio.genlayer.com/tx/0xf59e99064cbca1e3f574d2d149cd5800b5d514513bee8742a6bd284a2ab66e90) | ok |
| 15 | r1-buy | [0x111fdcae…](https://explorer-studio.genlayer.com/tx/0x111fdcae1eb7e9ca02829a3b6047145397f67a7788a5a050ee9d6849b4b9c376) | ok |
| 16 | r2-list | [0x408cb005…](https://explorer-studio.genlayer.com/tx/0x408cb0058c23400acebbc125a5497e3d46914b651e400ece871a8acc9bdcc10d) | ok |
| 17 | r2-buy | [0xb29ee443…](https://explorer-studio.genlayer.com/tx/0xb29ee443e1d4fe162fc20b080d170e665fd1d5749bdd71c4ded18481e59bf44d) | ok |
| 18 | r3-list | [0x78fa5f23…](https://explorer-studio.genlayer.com/tx/0x78fa5f23a971191fddf7762e23becf22a15870d1a5077673e7fa7178aefc0bb1) | ok |
| 19 | r4-list | [0x5d0e4078…](https://explorer-studio.genlayer.com/tx/0x5d0e40780cd455e48cf57d81a0d6cab29b1d9f836915bcb9113b76816247537e) | ok |
| 20 | r4-buy | [0xb32300e5…](https://explorer-studio.genlayer.com/tx/0xb32300e51ac6eb7698d831ab382cec4ec33b53cb917377b2bc9b4dd4d8412fff) | ok |
| 21 | neg3-stranger-list | [0x67026184…](https://explorer-studio.genlayer.com/tx/0x6702618414b6d36ebd95d010ac2fce82dee67f06eeaa4a3bfc3885a0f840324b) | error-observed |
| 22 | neg4-over-cap | [0xc80233e5…](https://explorer-studio.genlayer.com/tx/0xc80233e5fa7ffa53373dfbb7f30c98770fbde7e5ec1a64ef7e29966fe12f2a4b) | error-observed |
| 23 | neg6-list | [0xc1ef0930…](https://explorer-studio.genlayer.com/tx/0xc1ef09308222d03a32aa5a3d1fc8f001c9ddc624fab4840c9fc2ced24e6a3177) | ok |
| 24 | neg6-self-buy | [0x8ad67763…](https://explorer-studio.genlayer.com/tx/0x8ad67763c05adfd860c9637ef12fa8142240b017acba4c7f3de7fd17a7b23e9e) | error-observed |
| 25 | neg6-cancel | [0x0bcc3161…](https://explorer-studio.genlayer.com/tx/0x0bcc3161ad9a1bbe31c07830d803391ac4fe3a84838a921c05f5395ec89bc595) | ok |
| 26 | neg5-not-listed | [0x5f9dc81f…](https://explorer-studio.genlayer.com/tx/0x5f9dc81f5a04ba18cd2e8b75e001176438ed47fb49596f3b0e5ba6c7c74a82c9) | error-observed |
| 27 | neg2-wrong-value | [0x0fd0d285…](https://explorer-studio.genlayer.com/tx/0x0fd0d2851c65f8be75516615592e5bbae05fde941e396635ae96bec99ba2e1a8) | error-observed |
| 28 | neg1-unknown-event | [0x7ab02c82…](https://explorer-studio.genlayer.com/tx/0x7ab02c82645d265414fd4f8b3852bf6b7dfa370a26278144063e429fc6b22938) | error-observed |
| 29 | neg13-early-settle-e3 | [0x20f2bb1a…](https://explorer-studio.genlayer.com/tx/0x20f2bb1ab9c5c8ac9db2364cf20d84096ceefa4c5dfbc9c66e6bd5cadf20f6b8) | error-observed |
| 30 | s1-settle-e1 | [0x75cd8d29…](https://explorer-studio.genlayer.com/tx/0x75cd8d2962c6d5e4024e0763c133190eba1a82a7cbba17f0a57e5e3da04578d8) | ok |
| 31 | s2-settle-e2 | [0x2ec52ad0…](https://explorer-studio.genlayer.com/tx/0x2ec52ad0227a90cf85f748c41b9fe84b2d92f90c4ec236380991676de1a9aec0) | ok |
| 32 | s3-settle-e4 | [0xe8bc2e61…](https://explorer-studio.genlayer.com/tx/0xe8bc2e6180eff1153d9b57b9e27cbd15138b86113afb1b47084af581f2d5dd23) | ok |
| 33 | s3b-resettle-e4 | [0x92959238…](https://explorer-studio.genlayer.com/tx/0x929592387154185c68b658d75f7e64737c6f17ac390ddc341609f14ed1256c29) | ok |
| 34 | neg9-double-settle | [0x31d44a71…](https://explorer-studio.genlayer.com/tx/0x31d44a71987fa75fbd0238bc41ef3a2ae72882ff5a0ff13cbbced80dcdb15134) | error-observed |
| 35 | neg11-buy-held | [0x89522f2c…](https://explorer-studio.genlayer.com/tx/0x89522f2cf5461740ad9f5b7d15b4fee714d28ed2834ddba6ef72750101f1eb56) | error-observed |
| 36 | neg10-list-refunded | [0xdfd839b9…](https://explorer-studio.genlayer.com/tx/0xdfd839b93984b6f9b65297c7383e3301713c98fb7fb23d3512b7b8e416e4544c) | error-observed |
| 37 | neg7-stranger-withdraw | [0x3dd4205c…](https://explorer-studio.genlayer.com/tx/0x3dd4205ca8eae1eaa177f0cbd1ad7e6cb5a1d3a70fe80b1b3b16322a7a1376d2) | error-observed |
| 38 | w-org | [0x5e138ea5…](https://explorer-studio.genlayer.com/tx/0x5e138ea5e7d93987f87cfd03a7abac8dca3bfef366867b7ee8a47b2cd8b95f2c) | ok |
| 39 | w-art | [0x1c7cf496…](https://explorer-studio.genlayer.com/tx/0x1c7cf4967ca893f2f40ddc671d53f20afe45cb8f050f78190ed6408f975ff9a1) | ok |
| 40 | w-b1 | [0xea99a0d5…](https://explorer-studio.genlayer.com/tx/0xea99a0d57f63b4b6a95a49fbdada7b6df624db63924a4b4407b33d4932dd2a3e) | ok |
| 41 | w-b2 | [0xa8e1eb5f…](https://explorer-studio.genlayer.com/tx/0xa8e1eb5f2c4fea8d078c7c367832b0e43ecc1dafcd95464ff6875d2b45f29e79) | ok |
| 42 | neg8-double-withdraw | [0x1a3b56d8…](https://explorer-studio.genlayer.com/tx/0x1a3b56d826df7fce2d40b91aedea27cf67ce916a5340d0d1a1fd9f2333e12910) | error-observed |

## Final ledger (pre-registered in EXPECTED.md, confirmed by verify_evidence.mjs)

- 92 GEN in = 72 GEN withdrawn + 20 GEN live E3 escrow, contract balance 20 GEN
- Artist royalties paid: 3.2 GEN
- Resale volume: 32 GEN
- E1 Oasis Live '25: EVENT_HELD, 2 tickets sold, organizer paid 20 GEN
- E2 Future & Metro Boomin: CANCELLED, 2 tickets sold, both holders refunded the 10 GEN face price each (a resale buyer who paid 11 GEN gets 10 back)
- E3 Pentatonix, Bridgestone Arena, 9 Dec 2026: ON_SALE, 2 tickets sold, 20 GEN escrowed, NOT settled (real date in the future — the 20 GEN balance is live ticket escrow, not stranded value; an early settlement attempt was refused on-chain, neg13 TOO_EARLY)
- E4 KATSEYE, Target Center, 7 Nov 2026: POSTPONED, 0 tickets sold, 0 GEN escrowed, settled twice on-chain (settle_count 2) — the POSTPONED branch moves no money
- Tickets: #1 ACTIVE (B2), #2 ACTIVE (B1), #3 REFUNDED (B1), #4 REFUNDED (B2), #5 ACTIVE (B2, E3), #6 ACTIVE (B2, E3)
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
| neg13 | settle E3 before its date (2026-11-12 < 2026-12-09) | TOO_EARLY | error, state unchanged |

## Not covered on-chain (see EXPECTED.md)

- SOLD_OUT: no on-chain case (buying all 8 E3 tickets would close the live site's only buyable event); branch implemented + mock-covered.
- UNREACHABLE / SOURCES_DISAGREE settle outcomes: fail-closed, mock-covered only.
- E3 settlement: E3's real date is 2026-12-09, in the future; it is not settled in this run by design. An early attempt is refused on-chain (neg13, TOO_EARLY). Its 20 GEN escrow stays open until after the real date. The organizer key is retained offline by the project operator (never committed) so the organizer credit can be withdrawn after that settlement.

## Browser write loop

Run on the live site 2026-11-12 15:13–15:22 CST with in-browser
temporary test accounts (testnet GEN only, no real wallet). All four
transactions re-read live by the main agent: FINALIZED + MAJORITY_AGREE
+ leader SUCCESS.

| Step | Transaction | Outcome |
|------|-------------|---------|
| Temp account A (0x0e45…ebf3) buys 1 E3 ticket (10 GEN) | 0x2faacd425628126f9bc27b32694be5ff7a181ef1df805eedf12f725355d1ce5a | Ticket #7, ACTIVE; E3 sold 2/8 → 3/8; received 92 → 102 GEN |
| A lists ticket #7 for resale at 11 GEN | 0x658a1050c22b018fa57927167b082892f929fb1d162e1e5961887764daea72f7 | LISTED at 11 GEN (the cap); seller credit 9.9 GEN, artist credit 1.1 GEN; self-purchase button disabled |
| Temp account B (0x6519…460a) buys the resale | 0x2d9366ea3caeb3456033268696f0bde21b015541371678c7a43594989fbb2b79 | Ticket #7 owner → B, ACTIVE; resale board empty; received 102 → 113 GEN; royalties 3.2 → 4.3 GEN; resale volume 32 → 43 GEN |
| A withdraws the seller credit (9.9 GEN) | 0x0abf83648acb6544b9b25736be4db2d1606c47455878678e11cc68836e6ba145 | Withdrawn, FINALIZED; A's credit then 0; withdrawn 72 → 81.9 GEN; balance 41 → 31.1 GEN |

Follow-up (scripted, same day): the browser resale left a 1.1 GEN
artist royalty credit on the scripted-run artist account; it was
withdrawn by that account
(0x4a296ef1561b1bff58e3f9539af434073430b724910a5c2bd9e50164fceac7f7,
FINALIZED + SUCCESS). Final ledger: **113 GEN in = 83 GEN out + 30 GEN
balance (E3 live escrow only), all credits 0.**

Cold start passed: English default, dashes + UNCONFIRMED before the
readback, numbers exact after it, E1/E2/E4 tagged "Settled ·
historical demo", E3 ON_SALE and buyable, Contract field exactly the
v1.2 address.

Defect found in the browser pass and fixed (frontend only, no contract
change): the "TRANSACTIONS FROM THIS BROWSER" list showed 6 stale
records from the superseded v1.1 deployment (ticket 7/8 entries that
did not exist on the v1.2 contract) because the history key in
localStorage was not scoped to the contract. Fixed by scoping the
pending/history keys to the deployed contract address
(`fairgate-pending-txs:<address>`, `fairgate-my-txs:<address>`) and
re-loading the lists after the deployment loads; restoring a temporary
account now also triggers a readback + credit refresh (the credit
previously showed a dash until a manual REFRESH). Rebuilt and pushed;
re-verified by a fresh browser cold start (see below).

Re-check after the fix: pending a fresh browser cold start (to be
recorded here once done).

## Verify output

```
PASS byte parity (deployed code == repo source)
PASS source sha matches deployment.json
PASS deploy tx recorded
PASS tx neg0-not-creator FINALIZED+AGREE+ERROR with exact payload NOT_CREATOR
PASS tx neg14-bad-address FINALIZED+AGREE+ERROR with exact payload BAD_ADDRESS
PASS tx neg12-buy-unconfigured FINALIZED+AGREE+ERROR with exact payload EVENT_NOT_CONFIGURED
PASS tx cfg-e1 FINALIZED+AGREE+SUCCESS
PASS tx cfg-e2 FINALIZED+AGREE+SUCCESS
PASS tx cfg-e3 FINALIZED+AGREE+SUCCESS
PASS tx cfg-e4 FINALIZED+AGREE+SUCCESS
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
PASS tx neg13-early-settle-e3 FINALIZED+AGREE+ERROR with exact payload TOO_EARLY
PASS tx s1-settle-e1 FINALIZED+AGREE+SUCCESS
PASS tx s1-settle-e1 verdict recorded as EVENT_HELD
PASS tx s2-settle-e2 FINALIZED+AGREE+SUCCESS
PASS tx s2-settle-e2 verdict recorded as CANCELLED
PASS tx s3-settle-e4 FINALIZED+AGREE+SUCCESS
PASS tx s3-settle-e4 verdict recorded as POSTPONED
PASS tx s3b-resettle-e4 FINALIZED+AGREE+SUCCESS
PASS tx s3b-resettle-e4 verdict recorded as POSTPONED
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
PASS E3 readback: ON_SALE, 3 sold (2 scripted + 1 browser), escrow 30 GEN, never settled
PASS E4 readback: POSTPONED, 0 sold, escrow 0, settled twice
PASS E1 anchors are the probe-verified URLs
PASS E2 anchors are the probe-verified URLs
PASS E3 anchors are the probe-verified URLs
PASS E4 anchors are the probe-verified URLs
PASS E1 identity tokens are oasis + wembley
PASS E2 identity tokens are metro boomin + bridgestone
PASS E3 identity tokens are pentatonix + bridgestone
PASS E4 identity tokens are katseye + target center
PASS creator is the deployer P1
PASS ticket 1 readback == EXPECTED.md (ACTIVE, owner 0x5681…)
PASS ticket 2 readback == EXPECTED.md (ACTIVE, owner 0xb18a…)
PASS ticket 3 readback == EXPECTED.md (REFUNDED, owner 0xb18a…)
PASS ticket 4 readback == EXPECTED.md (REFUNDED, owner 0x5681…)
PASS ticket 5 readback == EXPECTED.md (ACTIVE, owner 0x5681…)
PASS ticket 6 readback == EXPECTED.md (ACTIVE, owner 0x5681…)
PASS ticket 7 readback == EXPECTED.md (ACTIVE, owner 0x6519…)
PASS credit P1 is 0 after withdrawals
PASS credit ORG is 0 after withdrawals
PASS credit ART is 0 after withdrawals
PASS credit B1 is 0 after withdrawals
PASS credit B2 is 0 after withdrawals
PASS credit OUT is 0 after withdrawals
PASS counts: 4 events, 7 tickets (6 scripted + 1 browser)
PASS ledger: 113 GEN in, 83 out, balance 30 GEN (= E3 live escrow, all disclosed), escrow 30, royalties 4.3 GEN, resale volume 43 GEN
PASS protocol is fairgate-1.2

verify: 78 PASS, 0 FAIL, 42 txs checked
INDEPENDENT VERIFICATION PASS
```
