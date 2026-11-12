# FairGate

Live site: https://chuanqili77.github.io/fairgate-genlayer/

FairGate combines fixed-price concert tickets, capped resale and event-outcome settlement on GenLayer Stable Studionet (61999). Tickets cost 10 GEN; resale is capped at 11 GEN with a 10% artist royalty rounded down in wei. Settlement creates pull-payment credits for the organizer or current holders; the entitled address withdraws them.

## Contract

- Protocol: **fairgate-1.5**
- Address: [0x0c1327e107D6DA6f1ec6499b159576c7bAF721EE](https://explorer-studio.genlayer.com/address/0x0c1327e107D6DA6f1ec6499b159576c7bAF721EE)
- Deploy: [0x8e962c49ad96e71b34cd6d80f4af6f3f4da47473cba59a8a17af0257ccafacd6](https://explorer-studio.genlayer.com/tx/0x8e962c49ad96e71b34cd6d80f4af6f3f4da47473cba59a8a17af0257ccafacd6)
- Source SHA-256: `bb3b2798db8e7a2a094d86a64a0ca21a0619e89852f361d816a32fd920e11991`
- Chain: Stable Studionet, **61999**; RPC: https://studio.genlayer.com/api
- Canonical source: [contracts/fairgate.py](contracts/fairgate.py), byte-identical to the deployed code.

## Positive-evidence settlement

Absence of cancellation does **not** prove that a show happened. EVENT_HELD needs positive evidence from each of two independently fetched, frozen sources identifying the act, venue and configured performance date. Accepted forms are explicit dated past performance, an original same-day first-night retrospective, an original same-day report of a past performance on the matching weekday night, or a dated completed-gig measured-spending record. Update timestamps, forecasts, negation, prior-week references and another act's dates cannot replace that proof.

Every validator independently fetches both sources and reproduces the verdict, fetch, identity, cancellation, postponement and held flags. The leader verdict must satisfy the same deterministic mapping before equivalence comparison. UNREACHABLE and SOURCES_DISAGREE preserve all contract state and escrow. Cancellation refunds current holders at face value; postponement retains escrow. Only dual positive EVENT_HELD credits the exact event escrow to the organizer, once.

Settlement also requires the pinned transaction time to reach the first second after the local event day. The contract derives and checks this boundary from start and UTC offset. Configuration is creator-only and precedes sales. Rescheduling is creator-only, POSTPONED-only and later-date-only; it changes no ticket, holder or escrow.

## Recorded state

| Event | Current date | Latest-final status | Escrow GEN |
|---|---|---|---|
| 1 · Oasis | 2025-07-25 | EVENT_HELD | 0 |
| 2 · Future & Metro Boomin | 2024-08-06 | CANCELLED | 0 |
| 3 · Pentatonix | 2026-12-09 | ON_SALE | 20 |
| 4 · KATSEYE | 2027-02-20 | POSTPONED | 10 |

The scripted run records **102 GEN received = 72 GEN withdrawn + 30 GEN escrow/balance**, with 3.2 GEN royalties and 32 GEN resale volume. All role credits are zero after withdrawal. E3's future escrow and E4's postponed escrow remain intentionally open.

Independent live verification: **152 PASS, 0 FAIL**, covering deployment and 53 scripted transactions. Successful operations require FINALIZED + MAJORITY_AGREE + leader SUCCESS. Negative operations require the exact expected finalized agreed ERROR and unchanged state. A successfully executed fail-closed call is not a successful settlement.

Local checks: **168 named Python checks**, including 5120 verdict/flag combinations, and **14 Node assertions** using shipped receipt/history helpers and real receipt fixtures. Python syntax, TypeScript checking, build and repository hygiene pass. These local fixtures are not live consensus.

No V1.5 browser write is recorded yet. The browser workflow and its actual signing surfaces are separately specified in [EXPECTED.md](EXPECTED.md); its future transactions must not be replaced with old browser evidence.

## Evidence and reproduction

- [EVIDENCE.md](EVIDENCE.md): finalized outcomes, transaction links and ledger.
- [REVIEWER.md](REVIEWER.md): frozen source anchors, mechanism and limits.
- [evidence/transactions.json](evidence/transactions.json): complete scripted manifest; raw receipts in evidence/receipts/.
- [evidence/readback-v1.5.json](evidence/readback-v1.5.json): latest-final state and observation time.
- [evidence/verification-v1.5.txt](evidence/verification-v1.5.txt): independent live output.
- [EXPECTED.md](EXPECTED.md), [EXPECTED_V15.md](EXPECTED_V15.md): prospective inputs and transparent source revisions.

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm run check-clean
npm run verify
node scripts/byte_parity.mjs
```

The frontend retains pending hashes across refresh, verifies finality and consensus, and reads latest-final state. A timeout remains unknown and is polled without resending. A changed=false settlement is explicitly shown as no state or fund movement. Temporary test-account backup downloads stay local; they are never evidence files.

## Source history and limits

V1.4's Lloyds page returned an HTTP-200 error document inside GenVM. Two E1 attempts correctly returned changed=false/UNREACHABLE. Original source, expectations, failed receipts and readback are preserved under [evidence/v1.4-first/](evidence/v1.4-first/); the recorded old balance was 70 GEN escrow plus 32 GEN withdrawable resale credits. V1.5 uses Radio X and The Independent/PA for E1. A JamBase preflight failed, so E2 uses the original do615 dated cancellation page. Diagnostic observations are recorded separately and never count as product settlement acceptance.

Historical V1.3 and older deployments are retired and archived. Their receipts prove historical execution, not safety of their old absence-of-cancellation payout rule. Use the current address above.

The English extractor recognizes bounded evidence forms, not general semantic truth. Source outages, changed wording or disagreement can lock escrow; beneficiaries cannot replace frozen URLs. Publisher independence is not cryptographic proof of reality. E3 is not settled before 2026-12-10T06:00:00Z; E4 stays postponed/rescheduled. SOLD_OUT and forged-validator cases are local tests, not live business demonstrations. Tickets are payment records, not venue admission credentials. Failed-payable negatives use zero value because Studionet retains value on failed payable calls.
