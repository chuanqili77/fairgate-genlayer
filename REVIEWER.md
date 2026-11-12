# FairGate mechanism and evidence

Read [README.md](README.md) for the payout rule and [EVIDENCE.md](EVIDENCE.md) for observed results. Canonical source: contracts/fairgate.py. Network: Stable Studionet, 61999.

V1.4 removes the inference that absence of cancellation means an event happened. Positive dated evidence must be reproduced independently from each fixed source. The validator rejects a leader verdict inconsistent with any evidence flag. Unavailable, contradictory or insufficient evidence cannot release funds.

The deployed V1.4 contract is 0x58EC3bAE9605e4b138566742Bc163528e5813F7f. E1 has no successful positive settlement: its Lloyds source returned an error page to GenVM, so two finalized agreed calls kept escrow locked. The transaction manifest is incomplete and a complete current-version live acceptance is not claimed. Pages still serves historical V1.3. Historical evidence remains explicitly separated in evidence/v1.3/.

Limitations include narrow English extraction, source outages, mutable publisher content, and intentionally unsettled future escrow. Agreement establishes reproduced inputs and deterministic execution, not real-world truth.
