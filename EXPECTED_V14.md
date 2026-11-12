# FairGate V1.4 regression plan — not executed on-chain

This is a new prospective plan, not a modification of the original V1.3 registration in evidence/v1.3/EXPECTED.md. No new deployment or executed test is asserted.

- A source with only a scheduled listing, no dated positive performance sentence: held flag false.
- One source confirms a dated performance, the other does not: SOURCES_DISAGREE; event/tickets/credits/escrow unchanged.
- Either source fails or lacks identity: UNREACHABLE; all state unchanged.
- Prior performance or another configured date: no organizer credit.
- Two independently fetched sources each affirm artist, venue and exact date, without conflicting status signals: EVENT_HELD; credit exact escrow once, then authorized pull withdrawal once.
- Forged leader held flags or verdict: validator rejection; no settlement.
- E1 current fixed retrospective and district guide do not confirm the exact configured date under the accepted pattern: funds must remain locked; do not relabel a general retrospective as sufficient evidence.
- E2 cancellation and E4 postponement must preserve refund/locked-funds behavior. E3 stays gated until its real settlement timestamp. No artificial timestamp or fabricated source may substitute in live acceptance.

Live deployment and acceptance must be performed only after a credible exact-date E1 evidence path is available; otherwise no successful organizer-payout acceptance is possible with these anchors. Historical receipts and Mock fixtures cannot substitute.
