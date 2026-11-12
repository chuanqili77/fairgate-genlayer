# FairGate release-rule verification

EVENT_HELD requires positive past-tense evidence from two independently fetched sources. The artist, venue, configured date and positive phrase must appear in the same sentence. Negated, conditional and future wording is rejected. A general tour retrospective or a different performance is insufficient. Cancellation, postponement, identity and fetch flags are included in validator equivalence, and the leader result must satisfy the same deterministic verdict mapping.

SOURCES_DISAGREE and UNREACHABLE leave event, tickets, escrow and credits unchanged. EVENT_HELD credits only the exact event escrow once, with pull-payment withdrawals. These behaviors pass local fixture-based state-machine tests but require a new deployment and live consensus verification.

Historical V1.3 evidence is retained under evidence/v1.3/. It proves historical execution only. Current V1.4 has no deployment or successful live payout evidence yet. E1 sources presently do not establish the exact configured date under the corrected rule. E3 remains subject to the future-date timestamp gate; it must never be prematurely settled to obtain an acceptance result.

The extractor is a deliberately narrow deterministic English pattern recognizer, not general semantic fact verification. It can lock funds when wording falls outside its accepted patterns. Two independent publications can still be wrong; agreement is not proof of the real-world event.
