# EXPECTED.md — FairGate evidence v1.1 (pre-registered BEFORE the run)

Contract: FairGate, protocol `fairgate-1.1`, Stable Studionet (61999).
Face price 10 GEN per ticket; resale cap 11 GEN (110%, cap included);
artist royalty 10% (price * 10 // 100 in wei, exact for whole-GEN prices).
Three launch events, fixed in the contract source (see README for why
they are fixed, and for the probe results behind the verdict rule).

## Why v1.1 (v1 superseded, archived in evidence/v1/)

v1 (fairgate-1, 0x6b42859c…) verified clean (byte parity TRUE, verify
52/52, ledger 61 in = 61 out, balance 0) but both its events were
already settled, so the live site had no writable on-chain flow left
for a new user: buy_ticket needs ON_SALE, list/buy_resale only accept
ON_SALE/SOLD_OUT/POSTPONED, settle was already done, withdraw credits
were all 0, and the ticket holders were evidence-run temp accounts
whose keys were deleted. v1.1 adds a third, live event E3 (Pentatonix,
2026-12-09, ON_SALE) on a new contract so the site has a real
buy / list-resale / buy-resale / withdraw flow. v1 history is
preserved unchanged in evidence/v1/.

## Events (fixed at deploy)

| ID | Event | Date | Source A (venue official) | Source B (independent) | Expected verdict |
|----|-------|------|---------------------------|------------------------|------------------|
| E1 | Oasis Live '25, Wembley Stadium, London | 2025-07-25 | http://www.wembleystadium.com/events/2025/OASIS | https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/ ("Oasis played Wembley Stadium in 2025") | EVENT_HELD |
| E2 | Future & Metro Boomin – We Trust You Tour, Bridgestone Arena, Nashville | 2024-08-06 20:00 | https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour ("CANCELLED: … has been cancelled") | https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets ("Cancelled - …", "Past(08/6/2024)") | CANCELLED |
| E3 | Pentatonix: Christmas in the City Tour, Bridgestone Arena, Nashville | 2026-12-09 19:00 | https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour | https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets | NOT SETTLED in this run (live event, ON_SALE) |

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
product evidence): E1/E2 as in v1 (Wembley official 200, 126,071
chars, none of the four words anywhere; Wembley Park 200, 154,962
chars, none of the four words anywhere; Bridgestone 200, 105,253
chars, cancel words only; do615 200, 62,652 chars, cancel words
only. Bandsintown returned 403 to validators twice and was dropped
as a source). E3 (probe contract 0xde24d42A…, 2026-11-12):
Bridgestone Pentatonix page 200, 101,205 chars, none of the four
words anywhere (not even the bare "cancel" substring); do615
Pentatonix page 200, 52,158 chars, none of the four words anywhere.
Both E3 pages list the show as scheduled for Wed Dec 9, 2026, 7:00 PM.

## Accounts (temporary, evidence run only)

ORG = organizer payout address, ART = artist payout address,
B1/B2 = buyers, OUT = stranger (negative caller). ORG/ART are set
once per event by configure_event before the first ticket sale.

## Evidence flow (35 txs + deploy = 36)

### A. Launch configuration (3)
| Label | Call | Expected |
|-------|------|----------|
| cfg-e1 | ORG configure_event(1, ORG, ART) | ok, parties_set true |
| cfg-e2 | ORG configure_event(2, ORG, ART) | ok, parties_set true |
| cfg-e3 | ORG configure_event(3, ORG, ART) | ok, parties_set true |

### B. Primary sales (6) — 10 GEN each, exact price
| Label | Call | Expected |
|-------|------|----------|
| t1-buy | B1 buy_ticket(1) | ok, ticket 1, owner B1, E1 escrow 10 |
| t2-buy | B2 buy_ticket(1) | ok, ticket 2, owner B2, E1 escrow 20 |
| t3-buy | B1 buy_ticket(2) | ok, ticket 3, owner B1, E2 escrow 10 |
| t4-buy | B2 buy_ticket(2) | ok, ticket 4, owner B2, E2 escrow 20 |
| t5-buy | B1 buy_ticket(3) | ok, ticket 5, owner B1, E3 escrow 10 |
| t6-buy | B2 buy_ticket(3) | ok, ticket 6, owner B2, E3 escrow 20 |

### C. Resale happy path (7)
| Label | Call | Expected |
|-------|------|----------|
| r1-list | B1 list_resale(1, 11) | ok, ticket 1 LISTED @ 11 GEN (cap boundary, allowed) |
| r1-buy | B2 buy_resale(1) with 11 GEN | ok, ticket 1 -> B2; B1 credit +9.9 GEN, ART credit +1.1 GEN |
| r2-list | B2 list_resale(2, 10) | ok, ticket 2 LISTED @ 10 GEN |
| r2-buy | B1 buy_resale(2) with 10 GEN | ok, ticket 2 -> B1; B2 credit +9 GEN, ART credit +1 GEN (total 2.1) |
| r3-list | B1 list_resale(3, 11) | ok, ticket 3 LISTED @ 11 GEN; stays LISTED into the CANCELLED settlement (tests the LISTED-refund path) |
| r4-list | B1 list_resale(5, 11) | ok, ticket 5 (E3) LISTED @ 11 GEN (cap boundary, allowed) |
| r4-buy | B2 buy_resale(5) with 11 GEN | ok, ticket 5 -> B2; B1 credit +9.9 GEN, ART credit +1.1 GEN (total 3.2) |

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

E3 is deliberately NOT settled in this run: its real date (2026-12-09)
is in the future. It stays ON_SALE with 6 of 8 tickets unsold so the
live site has a real usable flow (buy / list / buy-resale / withdraw).

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
| w-art | ART withdraw() | ok, 3.2 GEN (royalties 1.1 + 1 + 1.1) |
| w-b1 | B1 withdraw() | ok, 29.8 GEN (resale 9.9 + resale 9.9 + refund 10) |
| w-b2 | B2 withdraw() | ok, 19 GEN (resale 9 + refund 10) |
| neg8-double-withdraw | ORG withdraw() again | NO_CREDIT |

## Final readback (exact)

- E1: status EVENT_HELD, verdict EVENT_HELD, tickets_sold 2, escrowed 0, organizer_paid true, settle_count 1.
- E2: status CANCELLED, verdict CANCELLED, tickets_sold 2, escrowed 0, settle_count 1.
- E3: status ON_SALE, verdict '', tickets_sold 2, escrowed 20 GEN, settle_count 0, organizer_paid false.
- Tickets: 1 ACTIVE owner B2 (E1); 2 ACTIVE owner B1 (E1); 3 REFUNDED owner B1 (E2); 4 REFUNDED owner B2 (E2); 5 ACTIVE owner B2 (E3); 6 ACTIVE owner B2 (E3).
- Credits after all withdrawals: ORG 0, ART 0, B1 0, B2 0, OUT 0.
- Counts: event_count 3, ticket_count 6, total_received_wei 92 GEN
  (primary 60 + resales 32), total_withdrawn_wei 72 GEN,
  contract_balance_wei 20 GEN, escrowed_wei 20 GEN,
  total_royalties_wei 3.2 GEN, total_resale_volume_wei 32 GEN.
- Ledger, split in two on purpose:
  - Settled events (E1+E2): 40 GEN primary in, 21 GEN resales in,
    61 GEN withdrawn out, balance 0, escrow 0 — fully closed, same
    shape as v1.
  - Live event (E3): 20 GEN primary in (tickets 5+6), 11 GEN resale
    in, 11 GEN of that resale withdrawn as credits (9.9 seller +
    1.1 royalty), 20 GEN still escrowed in the contract — that is
    E3's open ticket escrow for a future show, NOT stranded value.
    The contract balance of 20 GEN is exactly E3's escrowed_wei.
  - Whole contract: 92 GEN in = 72 GEN withdrawn + 20 GEN live
    escrow, zero stranded value — every failed-payable negative
    sent 0 GEN by design.

## Honest note on failed payables

A failed payable call keeps its value in the contract (platform
behavior on Studionet). Every failed-payable negative in this run
(neg6-buy, neg5, neg2, neg1, neg11) sends 0 GEN, so no value can be
stranded. The verify script re-reads the full state before and
after each negative and fails the run if anything changed.

## Not covered by on-chain evidence in v1.1

- POSTPONED: no real postponed concert with dual fetchable sources
  was found (Post Malone Tottenham: the Bandsintown archive page
  carries no postponement wording; AR Rahman: sources conflict).
  The branch is implemented in the contract, shown in the frontend,
  and covered by mock tests — but there is no on-chain POSTPONED
  case in v1.1. Documented as a known gap, not hidden.
- BAD_ADDRESS (configure_event validation): all three events are
  configured once at the start of the run, so the error path cannot
  be triggered afterwards. Plain input validation, low risk.
- UNREACHABLE / SOURCES_DISAGREE settle outcomes: fail-closed
  branches with no state change; they occur only if a source fetch
  fails or the sources disagree, which the probe shows does not
  happen for these six URLs right now. Covered by mock tests.
- E3 settlement: E3's real date is 2026-12-09, in the future. It is
  not settled in this run by design; settling it before the show
  would be a misuse of the demo. Studionet has no clock, so the
  contract cannot refuse an early settle: the keyword rule would
  return EVENT_HELD (neither source says cancelled or postponed)
  and pay the organizer. The site disables the settle button until
  after the show date; the contract itself stays permissionless.
  Its escrow (20 GEN) stays open until after the real date, when
  it can be settled like E1/E2.

## Browser write loop (pre-registered before the browser run, 2026-11-12)

Two tabs, two in-browser temporary test accounts (each tab keeps its
own session key). Do NOT press settle on any event: E1/E2 are already
settled, and E3's settle button is disabled until after its show date
(2026-12-09) — settling E3 early would return EVENT_HELD by the
keyword rule. No real wallet is used.

| Step | Expected |
|------|----------|
| Cold start, no wallet | Page renders in English by default; before any FINALIZED readback the values are dashes + UNCONFIRMED and export is disabled; contract address is exactly 0x1001588861d740A600497523C56Fe96fd425A620. E1's poster shows HELD (never the raw text EVENT_HELD and never a raw key like app.status_EVENT_HELD); its Buy button is disabled. E3's settle button is disabled with the note that settlement opens after the show date. After readback: 3 events, 6 tickets, 20 GEN escrow. |
| Tab 1, temp account A buys 1 E3 ticket | 10 GEN escrowed, ticket #7, ACTIVE, owner A, FINALIZED. |
| Tab 1, A lists ticket #7 for resale at 11 GEN | LISTED at 11 GEN (the cap, included), FINALIZED. |
| Tab 2, temp account B buys the resale | 11 GEN paid, ticket #7 owner B, ACTIVE; A seller credit 9.9 GEN; artist credit 1.1 GEN; FINALIZED. |
| Tab 1, A withdraws the seller credit in-browser | 9.9 GEN withdrawn, FINALIZED; ticket #7 shows Withdrawn for the seller credit. |
| Artist royalty 1.1 GEN | Stays credited: the artist address belongs to the evidence run (key deleted under the checkpoint rule), same disclosure pattern as CallSettle's C6. Not withdrawn in this run; withdrawal of a royalty credit is proven by the evidence run's withdrawals. |

Ledger after the browser loop (exact):
- GEN in: 92 + 10 + 11 = 113 GEN
- GEN withdrawn on-chain: 72 + 9.9 = 81.9 GEN
- Contract balance 31.1 GEN = E3 escrow 30 GEN (3 tickets x 10) + artist royalty credit 1.1 GEN (unwithdrawn, see above); escrowed 30 GEN
- Tickets: 7, E3 sold 3/8; resale volume 32 + 11 = 43 GEN; royalties 3.2 + 1.1 = 4.3 GEN

## Browser write loop, pass 2 (pre-registered before the browser run, 2026-11-12)

Pass 1 proved buy / list / buy-resale in the browser but the seller
withdrawal failed: tab 1 was reloaded to refresh its readback and the
reload destroyed temp account A's in-memory session key; the site had
no key-restore flow. Two fixes shipped since (frontend only, no
contract change): a Refresh button in the readback strip (refresh
without reloading) and a restore-temporary-account flow (paste a saved
0x key), plus a last-chance key copy in the disconnect dialog and the
missing `app.stubOwner` label. Pass 2 re-runs the loop on a fresh
ticket and must NOT reload any tab.

Two tabs, two new in-browser temporary test accounts (C in tab 1, D
in tab 2). Do NOT press settle on any event. Do NOT reload either tab.

| Step | Expected |
|------|----------|
| Cold start re-check, no wallet | E1's poster shows HELD (never EVENT_HELD, never a raw key); its Buy button is disabled. Ticket stubs show "Owner: 0x…" (never "app.stubOwner"). The readback strip has a Refresh button. E3's settle button is disabled with the after-show-date note. |
| Tab 1, temp account C buys 1 E3 ticket | 10 GEN escrowed, ticket #8, ACTIVE, owner C, FINALIZED. |
| Tab 1, C lists ticket #8 for resale at 11 GEN | LISTED at 11 GEN, FINALIZED. |
| Tab 2, temp account D buys the resale | 11 GEN paid, ticket #8 owner D, ACTIVE; C seller credit 9.9 GEN; artist credit +1.1 GEN; FINALIZED. |
| Tab 1, C clicks Refresh (NOT reload) | The readback refreshes in place; C's withdrawable credit shows 9.9 GEN; C's session key survives (no reload happened). |
| Tab 1, C withdraws the seller credit in-browser | 9.9 GEN withdrawn, FINALIZED; credit then shows withdrawn. |
| Optional restore check | After the withdrawal, disconnect C (copy the key from the disconnect dialog first), then restore the same key with the restore field: the same address returns. If the restore UI is missing or fails, report it as a defect instead of working around it. |

Ledger after pass 2 (exact):
- GEN in: 113 + 10 + 11 = 134 GEN
- GEN withdrawn on-chain: 72 + 9.9 = 81.9 GEN
- Contract balance 52.1 GEN = E3 escrow 40 GEN (4 tickets x 10) + pass-1 seller credit 9.9 GEN to A (key lost on reload in pass 1, unwithdrawn, disclosed) + artist royalty credits 2.2 GEN (1.1 + 1.1, unwithdrawn, disclosed); escrowed 40 GEN
- Tickets: 8, E3 sold 4/8; resale volume 43 + 11 = 54 GEN; royalties 4.3 + 1.1 = 5.4 GEN
