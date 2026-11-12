# V1.5 source revision

V1.4 failed twice because the fixed Lloyds URL returned a publisher error page to GenVM. Its original source, expectations and failed results remain in evidence/v1.4-first/. V1.5 uses The Independent as E1 source B. Positive past performance "on Friday night" is dated only when the original article publication date exactly equals the configured event date and that date is a Friday. A modified timestamp, different weekday, prior-week reference, forecast, conditional prose or another identity is insufficient. Existing explicit-date, first-night and measured-record rules remain.

The full prospective transaction sequence and ledger are in EXPECTED.md. No V1.4 transaction counts toward the V1.5 product run.

# FairGate V1.5 evidence rules and regression scope

The prospective live flow and exact ledger are in EXPECTED.md. Historical V1.3 expectations are preserved separately and are not used as evidence for V1.5.

Positive proof must be dated and identify the target act and venue. Supported records are explicit dated past performance prose; an original same-day first-night article paired with retrospective prose; an original same-day matching weekday-night past-performance report; or an actual measured-spending statement paired with that artist's dated gig table and venue-internal spending row. A planned table, projected spending, another act's dated column, an update timestamp, a prior performance or another date must fail closed.

Both independent sources must satisfy the positive rule and contain no conflicting venue-linked status. Each validator re-fetches both and compares all flags. Contradiction, missing identity and unreachable sources move no money. The full Mock harness covers the shipped functions and state machine; only finalized successful real transactions plus latest-final state can establish live acceptance.
