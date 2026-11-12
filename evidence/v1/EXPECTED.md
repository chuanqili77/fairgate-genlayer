# EXPECTED.md — FairGate evidence (pre-registered BEFORE the run)

Contract: FairGate, protocol `fairgate-1`, Stable Studionet (61999).
Face price 10 GEN per ticket; resale cap 11 GEN (110%, cap included);
artist royalty 10% (price * 10 // 100 in wei, exact for whole-GEN prices).
Two launch events, fixed in the contract source (see README for why
they are fixed, and for the probe results behind the verdict rule).

## Events (fixed at deploy)

| ID | Event | Date | Source A (venue official) | Source B (independent) | Expected verdict |
|----|-------|------|---------------------------|------------------------|------------------|
| E1 | Oasis Live '25, Wembley Stadium, London | 2025-07-25 | http://www.wembleystadium.com/events/2025/OASIS | https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/ ("Oasis played Wembley Stadium in 2025") | EVENT_HELD |
| E2 | Future & Metro Boomin – We Trust You Tour, Bridgestone Arena, Nashville | 2024-08-06 20:00 | https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour ("CANCELLED: … has been cancelled") | https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets ("Cancelled - …", "Past(08/6/2024)") | CANCELLED |

Verdict rule (deterministic, no LLM): each validator fetches both
sources and scans the raw body, lowercased. Cancel words:
"cancelled", "canceled". Postpone words: stems "postpone",
"reschedule" (also match "postponed", "postponement", "rescheduled",
"rescheduling"). Both sources fetched OK + no cancel/postpone word
in either = EVENT_HELD. Both sources contain a cancel word =
CANCELLED. Both contain a postpone word = POSTPONED. Either fetch
fails = UNREACHABLE (no state change). Sources disagree =
SOURCES_DISAGREE (no state change). Equivalence vector is
(verdict, cancel_a, cancel_b, postpone_a, postpone_b, fetch_a_ok,
fetch_b_ok), exact equality.

Probe results (probe contract, validators fetching live — NOT the
product evidence): Wembley official 200, 126,071 chars, none of the
four words anywhere; Wembley Park 200, 154,962 chars, none of the
four words anywhere; Bridgestone 200, 105,253 chars, cancel words
only; do615 200, 62,652 chars, cancel words only. Bandsintown
returned 403 to validators twice and was dropped as a source (see
README). Widened postpone stems were re-probed before the run.

## Accounts (temporary, evidence run only)

ORG = organizer payout address, ART = artist payout address,
B1/B2 = buyers, OUT = stranger (negative caller). ORG/ART are set
once per event by configure_event before the first ticket sale.

## Evidence flow (30 txs + deploy = 31)

### A. Launch configuration (2)
| Label | Call | Expected |
|-------|------|----------|
| cfg-e1 | ORG configure_event(1, ORG, ART) | ok, parties_set true |
| cfg-e2 | ORG configure_event(2, ORG, ART) | ok, parties_set true |

### B. Primary sales (4) — 10 GEN each, exact price
| Label | Call | Expected |
|-------|------|----------|
| t1-buy | B1 buy_ticket(1) | ok, ticket 1, owner B1, E1 escrow 10 |
| t2-buy | B2 buy_ticket(1) | ok, ticket 2, owner B2, E1 escrow 20 |
| t3-buy | B1 buy_ticket(2) | ok, ticket 3, owner B1, E2 escrow 10 |
| t4-buy | B2 buy_ticket(2) | ok, ticket 4, owner B2, E2 escrow 20 |

### C. Resale happy path (5)
| Label | Call | Expected |
|-------|------|----------|
| r1-list | B1 list_resale(1, 11) | ok, ticket 1 LISTED @ 11 GEN (cap boundary, allowed) |
| r1-buy | B2 buy_resale(1) with 11 GEN | ok, ticket 1 -> B2; B1 credit +9.9 GEN, ART credit +1.1 GEN |
| r2-list | B2 list_resale(2, 10) | ok, ticket 2 LISTED @ 10 GEN |
| r2-buy | B1 buy_resale(2) with 10 GEN | ok, ticket 2 -> B1; B2 credit +9 GEN, ART credit +1 GEN (total 2.1) |
| r3-list | B1 list_resale(3, 11) | ok, ticket 3 LISTED @ 11 GEN; stays LISTED into the CANCELLED settlement (tests the LISTED-refund path) |

### D. Resale + purchase negatives (8) — exact error codes, 0 GEN on failed payables
| Label | Call | Expected error |
|-------|------|----------------|
| neg3-stranger-list | B2 list_resale(2, 10) — ticket 2 belongs to B1 | NOT_TICKET_OWNER |
| neg4-over-cap | B2 list_resale(1, 12) — ticket 1 belongs to B2 | PRICE_CAP |
| neg6-list | B1 list_resale(2, 11) | ok (setup for neg6-buy) |
| neg6-self-buy | B1 buy_resale(2) with 11 GEN — own listing | SELF_PURCHASE (0 GEN sent) |
| neg6-cancel | B1 cancel_resale(2) | ok, ticket 2 ACTIVE again |
| neg5-not-listed | B2 buy_resale(4) with 10 GEN — ticket 4 never listed | TICKET_NOT_LISTED (0 GEN sent) |
| neg2-wrong-value | B1 buy_ticket(1) with 0 GEN | VALUE_MUST_EQUAL_PRICE (0 GEN sent) |
| neg1-unknown-event | B1 buy_ticket(99) with 0 GEN | EVENT_NOT_FOUND (0 GEN sent) |

### E. Settlements (2) — caller OUT (anyone may settle; consensus decides)
| Label | Call | Expected |
|-------|------|----------|
| s1-settle-e1 | OUT settle_event(1) | ok, verdict EVENT_HELD; E1 status EVENT_HELD; ORG credit +20 GEN; E1 escrow 0. Retry up to 3x on MAJORITY_DISAGREE; a disagreement leaves everything unchanged. |
| s2-settle-e2 | OUT settle_event(2) | ok, verdict CANCELLED; E2 status CANCELLED; ticket 3 (LISTED, owner B1) REFUNDED +10 GEN; ticket 4 (ACTIVE, owner B2) REFUNDED +10 GEN; E2 escrow 0. Retry up to 3x on MAJORITY_DISAGREE. |

### F. Post-settlement negatives (4)
| Label | Call | Expected error |
|-------|------|----------------|
| neg9-double-settle | OUT settle_event(1) — already HELD | EVENT_ALREADY_SETTLED |
| neg11-buy-held | B1 buy_ticket(1) with 0 GEN — event HELD | EVENT_NOT_ON_SALE (0 GEN sent) |
| neg10-list-refunded | B1 list_resale(3, 10) — ticket 3 REFUNDED | TICKET_NOT_ACTIVE |
| neg7-stranger-withdraw | OUT withdraw() — no credit | NO_CREDIT |

### G. Withdrawals (5) — pull-payment, exact credits
| Label | Call | Expected |
|-------|------|----------|
| w-org | ORG withdraw() | ok, 20 GEN (E1 escrow) |
| w-art | ART withdraw() | ok, 2.1 GEN (royalties 1.1 + 1) |
| w-b1 | B1 withdraw() | ok, 19.9 GEN (resale 9.9 + refund 10) |
| w-b2 | B2 withdraw() | ok, 19 GEN (resale 9 + refund 10) |
| neg8-double-withdraw | ORG withdraw() again | NO_CREDIT |

## Final readback (exact)

- E1: status EVENT_HELD, verdict EVENT_HELD, tickets_sold 2, escrowed 0, organizer_paid true, settle_count 1.
- E2: status CANCELLED, verdict CANCELLED, tickets_sold 2, escrowed 0, settle_count 1.
- Tickets: 1 ACTIVE owner B2 (E1); 2 ACTIVE owner B1 (E1); 3 REFUNDED owner B1 (E2); 4 REFUNDED owner B2 (E2).
- Credits after all withdrawals: ORG 0, ART 0, B1 0, B2 0, OUT 0.
- Counts: event_count 2, ticket_count 4, total_received_wei 61 GEN
  (primary 40 + resales 21), total_withdrawn_wei 61 GEN,
  contract_balance_wei 0, escrowed_wei 0, total_royalties_wei 2.1 GEN,
  total_resale_volume_wei 21 GEN.
- Ledger: 61 GEN in = 61 GEN out, balance 0 (zero stranded value —
  every failed-payable negative sent 0 GEN by design).

## Honest note on failed payables

A failed payable call keeps its value in the contract (platform
behavior on Studionet). Every failed-payable negative in this run
(neg6-buy, neg5, neg2, neg1, neg11) sends 0 GEN, so no value can be
stranded. The verify script re-reads the full state before and
after each negative and fails the run if anything changed.

## Not covered by on-chain evidence in v1

- POSTPONED: no real postponed concert with dual fetchable sources
  was found (Post Malone Tottenham: the Bandsintown archive page
  carries no postponement wording; AR Rahman: sources conflict).
  The branch is implemented in the contract, shown in the frontend,
  and covered by mock tests — but there is no on-chain POSTPONED
  case in v1. Documented as a known gap, not hidden.
- BAD_ADDRESS (configure_event validation): both events are
  configured once at the start of the run, so the error path cannot
  be triggered afterwards. Plain input validation, low risk.
- UNREACHABLE / SOURCES_DISAGREE settle outcomes: fail-closed
  branches with no state change; they occur only if a source fetch
  fails or the sources disagree, which the probe shows does not
  happen for these four URLs right now. Covered by mock tests.
