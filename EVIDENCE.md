# FairGate — Evidence

- Contract: [0x6b42859cA5ef671F8DC27A191E450cCe8B9cAE12](https://explorer-studio.genlayer.com/address/0x6b42859cA5ef671F8DC27A191E450cCe8B9cAE12)
- Deploy tx: [0x61fea807…](https://explorer-studio.genlayer.com/tx/0x61fea80782dddb0ba36846527980da80f32c062afeea8bb64c900443e5285c93)
- Source SHA-256: `1d2201c7dac9385b86f5a74f711acd076c68d7cef75604cc06fd42c1b0f5cb7c` (21978 bytes, `contracts/fairgate.py`)
- Network: GenLayer Stable Studionet (chain 61999)
- Independent verification: `node scripts/verify_evidence.mjs` — PASS (see output below)
- Mock tests: `python3 tests/test_fairgate_mock.py` — all pass

## Evidence transactions (30)

| # | Step | Transaction | Result |
|---|------|-------------|--------|
| 1 | cfg-e1 | [0xaf8d6d27…](https://explorer-studio.genlayer.com/tx/0xaf8d6d271603f619572949e0f83418d71217ee3d46fc1f4024947d646ece08be) | ok |
| 2 | cfg-e2 | [0x4ee4d3a3…](https://explorer-studio.genlayer.com/tx/0x4ee4d3a3ba46670620d6188d5de0535ef521156b1786632dc45ca3cbd854d729) | ok |
| 3 | t1-buy | [0xd070f866…](https://explorer-studio.genlayer.com/tx/0xd070f86649550b7329aaae325ae15020f5355bfc7004459a7d6c9b494c0d3209) | ok |
| 4 | t2-buy | [0xff6747e6…](https://explorer-studio.genlayer.com/tx/0xff6747e6b0baa63533f1ccdcf748b6b2169278ff79311e5a89dada23bb819e90) | ok |
| 5 | t3-buy | [0xc14335c4…](https://explorer-studio.genlayer.com/tx/0xc14335c4f3edabf80256e603d8cc18adc09dec6326309c9abe5542220cd36fef) | ok |
| 6 | t4-buy | [0xbf27644e…](https://explorer-studio.genlayer.com/tx/0xbf27644ef3dcc16afa6c7bf20cf7ee16cbf19cf5539c7bf2941fe63054d2f330) | ok |
| 7 | r1-list | [0xbe9445f0…](https://explorer-studio.genlayer.com/tx/0xbe9445f0d69bace6bc3258a25764391accaade12314079df41182d2619f4e69c) | ok |
| 8 | r1-buy | [0xc6e7995a…](https://explorer-studio.genlayer.com/tx/0xc6e7995a7be9730fd8dd25c31700ffa0d36651e9d70b3975249c08ee12e80e5d) | ok |
| 9 | r2-list | [0xc5309b68…](https://explorer-studio.genlayer.com/tx/0xc5309b68589300a9afd803e27569208e7575a4c93193397b2e9ca7e8fdd3d4f6) | ok |
| 10 | r2-buy | [0xebe8b9c9…](https://explorer-studio.genlayer.com/tx/0xebe8b9c9c05c818669e500e2f99cb62adab53fe0626bc2cf36dc09bef60a753c) | ok |
| 11 | r3-list | [0xcecc1f77…](https://explorer-studio.genlayer.com/tx/0xcecc1f77191190d48d5e7a7be024bac88dcce45e56ea7ef9c6c6d6a20e3ad412) | ok |
| 12 | neg3-stranger-list | [0xe5768948…](https://explorer-studio.genlayer.com/tx/0xe57689488d0594a1aa5f5d3c3611cb989ae7fcb2f73da9906a4eb2a14ce2da8b) | error-observed |
| 13 | neg4-over-cap | [0xc32d2440…](https://explorer-studio.genlayer.com/tx/0xc32d2440e7de5c82346f5059b97ed8e66cd987594269d3e7608ee25cd8db310c) | error-observed |
| 14 | neg6-list | [0xe6bf512a…](https://explorer-studio.genlayer.com/tx/0xe6bf512ab555e32dc5df8cc84a748975ed85ea182c41abe0b81cce88cd47437c) | ok |
| 15 | neg6-self-buy | [0x32743a68…](https://explorer-studio.genlayer.com/tx/0x32743a68d034d0c55a66258bbb2c904274525f36096999b9ea78ef78ac91223b) | error-observed |
| 16 | neg6-cancel | [0x66d02b1a…](https://explorer-studio.genlayer.com/tx/0x66d02b1aec1f4ad09f5eaa22f19891841551371199238fe1cc8401dfd74e9fd9) | ok |
| 17 | neg5-not-listed | [0x34ad44e9…](https://explorer-studio.genlayer.com/tx/0x34ad44e9e263e6288089066d21e4725acb8d9f559dda5737330f0841051ab7ba) | error-observed |
| 18 | neg2-wrong-value | [0x613e74e0…](https://explorer-studio.genlayer.com/tx/0x613e74e01139670c61f7ec98de94e15ff6cfbac6faa9a88c4135074e543fe97e) | error-observed |
| 19 | neg1-unknown-event | [0xc72df404…](https://explorer-studio.genlayer.com/tx/0xc72df4044447909e3e558d112f3905a67d360706aad8835b9fa09167f7dc96b8) | error-observed |
| 20 | s1-settle-e1 | [0x834b10e5…](https://explorer-studio.genlayer.com/tx/0x834b10e59ff8cd5c32879d4c5a1b540ebb1e235a59fe93e0bcdbf3e20b142403) | ok |
| 21 | s2-settle-e2 | [0x2e7f3719…](https://explorer-studio.genlayer.com/tx/0x2e7f3719f1277a0c96cd459e43a2cd4a4c39dac6d6da676c3e45553005b50239) | ok |
| 22 | neg9-double-settle | [0x32d8d9f3…](https://explorer-studio.genlayer.com/tx/0x32d8d9f33cadd37712919e4ce81fb22aef748df619b4b9303fa6ceb156ad4d33) | error-observed |
| 23 | neg11-buy-held | [0x3c1e11db…](https://explorer-studio.genlayer.com/tx/0x3c1e11dbc5fd1eee8732bbd49768a8c5c998d1c6894949e3327d7f1c2386b757) | error-observed |
| 24 | neg10-list-refunded | [0xddbcf666…](https://explorer-studio.genlayer.com/tx/0xddbcf666f6b6ccd1529e0826973b877b5278fe97ea55822c5d13da058248e67f) | error-observed |
| 25 | neg7-stranger-withdraw | [0xbbf2cc24…](https://explorer-studio.genlayer.com/tx/0xbbf2cc24b4899f5cb2d1162991ebc883eb903b2d08c827802fe0acd1efce7b97) | error-observed |
| 26 | w-org | [0xdd4454d5…](https://explorer-studio.genlayer.com/tx/0xdd4454d5381e85bfbcae0ae594f7e52651ba1ec9c49c7789c35321b29cd98945) | ok |
| 27 | w-art | [0xa5cc202b…](https://explorer-studio.genlayer.com/tx/0xa5cc202b9dbf3376494f45c1984bd9bacb24f8dab2c70f1388c08670f9d9ccc6) | ok |
| 28 | w-b1 | [0xe5e726ca…](https://explorer-studio.genlayer.com/tx/0xe5e726ca7f382a0b4a5675b9f1eef7b20dde1b4f0962bd9d6554a1c72ad8520d) | ok |
| 29 | w-b2 | [0x30767a39…](https://explorer-studio.genlayer.com/tx/0x30767a39454a0e7be78b3b0b722c52b02e0b53adee11838080ddcdf30829b14a) | ok |
| 30 | neg8-double-withdraw | [0x7dc21f74…](https://explorer-studio.genlayer.com/tx/0x7dc21f741285fe8cfea83e95e3e2e58f50224bc9d2bda27ce1c3a0c328a6e694) | error-observed |

## Final ledger (pre-registered in EXPECTED.md, confirmed by verify_evidence.mjs)

- 61 GEN in = 61 GEN out, contract balance 0 GEN, escrow 0 GEN
- Artist royalties paid: 2.1 GEN
- Resale volume: 21 GEN
- E1 Oasis Live '25: EVENT_HELD, 2 tickets sold, organizer paid 20 GEN
- E2 Future & Metro Boomin: CANCELLED, 2 tickets sold, both holders refunded 10 GEN each
- Tickets: #1 ACTIVE (B2), #2 ACTIVE (B1), #3 REFUNDED (B1), #4 REFUNDED (B2)
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
- BAD_ADDRESS configure guard: both events configured once at run start, error path unreachable afterwards.

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
PASS tx t1-buy FINALIZED+AGREE+SUCCESS
PASS tx t2-buy FINALIZED+AGREE+SUCCESS
PASS tx t3-buy FINALIZED+AGREE+SUCCESS
PASS tx t4-buy FINALIZED+AGREE+SUCCESS
PASS tx r1-list FINALIZED+AGREE+SUCCESS
PASS tx r1-buy FINALIZED+AGREE+SUCCESS
PASS tx r2-list FINALIZED+AGREE+SUCCESS
PASS tx r2-buy FINALIZED+AGREE+SUCCESS
PASS tx r3-list FINALIZED+AGREE+SUCCESS
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
PASS E1 anchors are the probe-verified URLs
PASS E2 anchors are the probe-verified URLs
PASS ticket 1 readback == EXPECTED.md (ACTIVE, owner 0x7042…)
PASS ticket 2 readback == EXPECTED.md (ACTIVE, owner 0x6678…)
PASS ticket 3 readback == EXPECTED.md (REFUNDED, owner 0x6678…)
PASS ticket 4 readback == EXPECTED.md (REFUNDED, owner 0x7042…)
PASS credit P1 is 0 after withdrawals
PASS credit ORG is 0 after withdrawals
PASS credit ART is 0 after withdrawals
PASS credit B1 is 0 after withdrawals
PASS credit B2 is 0 after withdrawals
PASS credit OUT is 0 after withdrawals
PASS counts: 2 events, 4 tickets
PASS ledger: 61 GEN in = 61 out, balance 0, escrow 0, royalties 2.1 GEN, resale volume 21 GEN
PASS protocol is fairgate-1

verify: 52 PASS, 0 FAIL, 30 txs checked
INDEPENDENT VERIFICATION PASS
```
