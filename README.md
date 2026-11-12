# FairGate

Live site: https://chuanqili77.github.io/fairgate-genlayer/

FairGate combines fixed-price concert tickets, capped resale and event-outcome settlement on GenLayer Stable Studionet (61999). Tickets cost 10 GEN; resale is capped at 11 GEN with a 10% artist royalty rounded down in wei. Settlement records pull-payment credits for the organizer or current holders.

Current canonical source: **fairgate-1.5, awaiting a matching product deployment and live evidence**. The V1.4 observations below concern the previous source and address. V1.5 fixes the inaccessible second E1 source; see [EXPECTED_V15.md](EXPECTED_V15.md).

## Positive-evidence settlement

Protocol `fairgate-1.5` requires two independently fetched, fixed publications to identify the act and venue and provide positive evidence of the configured dated performance. Merely finding no cancellation or postponement is insufficient. Supported records are explicit dated past-tense performance prose, an original same-day first-night retrospective, or a dated completed-gig measured-spending record. Planned listings, conditional or negated prose, another act's date, and update timestamps cannot authorize a payout.

Validators independently fetch both URLs and reproduce every verdict, fetch, identity, cancellation, postponement and held flag. The leader's verdict must satisfy the deterministic mapping before equivalence comparison. Unavailable or insufficient evidence returns `UNREACHABLE`; conflicting evidence returns `SOURCES_DISAGREE`. Both preserve all contract state and escrow. Venue-linked cancellation refunds current holders at face value; postponement keeps escrow locked. Only a dual positive `EVENT_HELD` credits the exact event escrow to the organizer, once.

Settlement requires the pinned transaction timestamp to reach the first second after the local event day. The contract derives this boundary from the configured start and UTC offset. Only the creator may configure payees before sales or reschedule a postponed event to a later date; rescheduling preserves tickets, holders and escrow.

## Deployment and observed limitation

- V1.4: [0x58EC3bAE9605e4b138566742Bc163528e5813F7f](https://explorer-studio.genlayer.com/address/0x58EC3bAE9605e4b138566742Bc163528e5813F7f)
- Deployment: [0x26863639f7306e9a68c62892683e21e03ddb9244c6668bb19eb76c6b5a517d71](https://explorer-studio.genlayer.com/tx/0x26863639f7306e9a68c62892683e21e03ddb9244c6668bb19eb76c6b5a517d71)
- Source SHA-256: `1158a74ac511e4600ba8c822288297bf4530d3f2a2efc7b54ea89c387e0e27c6`
- Deployment was FINALIZED + MAJORITY_AGREE + SUCCESS with byte-identical canonical source.

The E1 positive settlement has **not succeeded**. Two finalized, agreed, successfully executed calls returned `changed=false`, `UNREACHABLE`: Radio X identified the completed performance, while Lloyds failed identity and held checks. An independent GenVM diagnostic received a Lloyds error page (HTTP 200, Error 1007), although an ordinary local HTTP request received the article. Escrow remained locked. Successful execution of a fail-closed call is not successful payout evidence.

The prospective plan remains unchanged in [EXPECTED.md](EXPECTED.md). Current transaction evidence is explicitly incomplete. The published Pages deployment remains historical V1.3 until a corrected deployment has full live evidence; V1.3's original source and documents are preserved under [evidence/v1.3/](evidence/v1.3/). Historical receipts establish historical execution, not correctness of V1.4's payout rule.

## Fixed launch events

| Event | Date | Fixed sources | Intended path |
|---|---|---|---|
| Oasis, Wembley Stadium | 25 July 2025 | Radio X; Lloyds Banking Group | Dual positive performance evidence; currently fails closed |
| Future & Metro Boomin, Bridgestone Arena | 6 August 2024 | Venue; do615 | Cancellation |
| Pentatonix, Bridgestone Arena | 9 December 2026 | Venue; do615 | Future sale; early settlement refused |
| KATSEYE, Target Center | 7 November 2026 | Venue; iHeart | Postponement and later rescheduling |

## Reproducible checks

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm run check-clean
node scripts/verify_evidence.mjs --historical-v13
```

Mock tests exercise the actual Python contract code, including exhaustive verdict/flag combinations, independent validator fetching, forged results, time boundaries, unchanged fail-closed state, permissions, resale caps, royalties and withdrawal conservation. Node tests exercise shipped receipt/history helpers. They are not live consensus. The default live verifier requires a complete current-deployment transaction manifest and refuses this incomplete run.

The frontend preserves pending hashes across refresh, checks FINALIZED + MAJORITY_AGREE + SUCCESS, and reads latest-final state. A timeout keeps the transaction pending rather than resending it or declaring success. A local test-account backup download is available; wallet credentials never belong in evidence or the repository.

## Limits

The deterministic English extractor recognizes bounded evidence forms rather than general semantic truth. Source outages or unsupported wording can keep escrow locked; fixed URLs cannot be replaced by beneficiaries. Publisher independence is not cryptographic proof of reality. Future E3 is not eligible for settlement before 2026-12-10T06:00:00Z. Tickets are payment records, not venue admission credentials. Failed-payable tests use zero value because the Studionet runtime retains value on failed payable calls.
