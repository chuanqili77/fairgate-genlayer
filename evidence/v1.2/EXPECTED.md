# EXPECTED.md — FairGate evidence v1.2 (pre-registered BEFORE the run)

Contract: FairGate, protocol `fairgate-1.2`, Stable Studionet (61999).
Address: `0x38b0aE26d0C6DE7F5C8418368a2dc10f4d843E5E`
Deploy tx: `0xb022a4db01dd729942e7e9c7ba87c304373129869dd7500732bbb6fe259382f6`
Source SHA-256: `51a4059beb9e72be889b6096577581d7947ed71f903b9b2faf236a43a6c414df` (29,128 bytes).
Face price 10 GEN per ticket; resale cap 11 GEN (110%, cap included);
artist royalty 10% (price * 10 // 100 in wei, exact for whole-GEN prices).
Four launch events, fixed in the contract source (see README for why
they are fixed, and for the probe results behind the verdict rule).

## Why v1.2 (v1.1 superseded, archived in evidence/v1.1/)

v1.1 (fairgate-1.1, 0x10015888…) verified clean (byte parity TRUE,
verify 65/65, ledger 134 in = 72 out + 62 balance) but had three
defects that are fixed in v1.2:

1. `configure_event` was permissionless: the first caller could set
   itself as organizer/artist for any event. v1.2 records the
   deployer as `creator` at construction; only the creator can
   configure an event (new error `NOT_CREATOR`).
2. Settlement had no date gate: anyone could settle the future
   event E3 today and the keyword rule would return EVENT_HELD,
   paying the organizer before the show. v1.2 refuses settlement
   on-chain before the day after the event date, using the
   transaction datetime (GenLayer-native, deterministic across
   validators). A too-early attempt fails with `TOO_EARLY` and
   changes nothing. The frontend settle button is disabled until
   the day after the show as a second layer only.
3. The verdict read keywords only: a page about a different event
   that happened to contain "cancelled" could flip the verdict.
   v1.2 requires each source to also confirm it is the right event
   (artist token AND venue token present on the page) before its
   keywords count; otherwise the verdict is UNREACHABLE.

v1.2 also adds a fourth launch event E4 (KATSEYE, Target Center,
Minneapolis, 2026-11-07, POSTPONED) so the POSTPONED branch is
proven on-chain for the first time, and adds the missing
`buy_ticket` guard for unconfigured events (`EVENT_NOT_CONFIGURED`).
v1.1 history is preserved unchanged in evidence/v1.1/.

## Events (fixed at deploy)

| ID | Event | Date | Source A (venue official) | Source B (independent) | Expected verdict |
|----|-------|------|---------------------------|------------------------|------------------|
| E1 | Oasis Live '25, Wembley Stadium, London | 2025-07-25 | http://www.wembleystadium.com/events/2025/OASIS | https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/ ("Oasis played Wembley Stadium in 2025") | EVENT_HELD |
| E2 | Future & Metro Boomin – We Trust You Tour, Bridgestone Arena, Nashville | 2024-08-06 20:00 | https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour ("CANCELLED: … has been cancelled") | https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets ("Cancelled - …", "Past(08/6/2024)") | CANCELLED |
| E3 | Pentatonix: Christmas in the City Tour, Bridgestone Arena, Nashville | 2026-12-09 19:00 | https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour | https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets | NOT SETTLED in this run (live event, ON_SALE; date gate refuses settlement before 2026-12-10) |
| E4 | KATSEYE — THE WILDWORLD TOUR, Target Center, Minneapolis | 2026-11-07 20:00 | https://www.targetcenter.com/events/detail/katseye (title "KATSEYE - POSTPONED \| Target Center") | https://www.musictimes.com/articles/113245/20261109/katseye-postpone-chicago-minneapolis-shows-megan-recovers-concussion.htm (independent news report, postponement confirmed) | POSTPONED |

Verdict rule (deterministic, no LLM): each validator fetches both
sources and scans the raw body, lowercased. Cancel words:
"cancelled", "canceled". Postpone words: stems "postpone",
"reschedule" (also match "postponed", "postponement", "rescheduled",
"rescheduling"). Identity check first: the page must contain the
artist token AND the venue token for the event (E1: oasis +
wembley; E2: metro boomin + bridgestone; E3: pentatonix +
bridgestone; E4: katseye + target center). A source that fails to
fetch, or fails the identity check, cannot vote: the verdict is
UNREACHABLE (no state change). Both sources fetched OK + identity
confirmed + no cancel/postpone word in either = EVENT_HELD. Both
sources contain a cancel word = CANCELLED. Both contain a postpone
word = POSTPONED. Sources disagree = SOURCES_DISAGREE (no state
change). Equivalence vector is (verdict, cancel_a, cancel_b,
postpone_a, postpone_b, fetch_a_ok, fetch_b_ok, identity_a,
identity_b), exact equality.

Settlement date gate (on-chain): settle_event reads the
transaction datetime and requires today > date_iso. Attempts on
or before the event date fail with TOO_EARLY, state unchanged.

Probe results (probe contract 0x6C7Fa707…, 2026-11-12, validators
fetching live — NOT the product evidence): E1a Wembley official
200, 126,071 chars, no keywords, identity true; E1b Wembley Park
200, 154,962 chars, no keywords, identity true; E2a Bridgestone
200, 105,253 chars, cancel only, identity true; E2b do615 200,
62,654 chars, cancel only, identity true; E3a Bridgestone
Pentatonix 200, 101,205 chars, no keywords, identity true; E3b
do615 Pentatonix 200, 52,158 chars, no keywords, identity true;
E4a Target Center 200, 137,128 chars, postpone only, identity
true; E4b MusicTimes 200, 220,339 chars, postpone only, identity
true. Clock check on the same probe: the contract's
`datetime.now(timezone.utc)` returned 2026-11-12T06:20:50Z, the
same minute as real UTC — the transaction datetime is available
on-chain and matches wall-clock time at submission. Bandsintown
returned 403 to validators and was dropped as a source (as in
v1); the Minneapolis listing site was unreachable and the
ticket-aggregator page returned 403, so E4's second source is an
independent news report rather than a listing (disclosed).

## Accounts (temporary, evidence run only)

P1 = deployer and creator (only P1 can configure events).
ORG = organizer payout address, ART = artist payout address,
B1/B2 = buyers, OUT = stranger (negative caller). ORG/ART are set
once per event by configure_event before the first ticket sale.
The ORG key is RETAINED after this run (held offline by the project
operator, never committed) because E3's organizer credit can only be
withdrawn after E3 settles after 2026-12-09; it is deleted after
that withdrawal.

## Evidence flow (42 txs + deploy = 43)

### A. Pre-configure negatives (3) — exact error codes, 0 GEN on failed payables
| Label | Call | Expected error |
|-------|------|----------------|
| neg0-not-creator | OUT configure_event(1, ORG, ART) — not the creator | NOT_CREATOR |
| neg14-bad-address | P1 configure_event(1, '0x123', ART) — malformed address | BAD_ADDRESS |
| neg12-buy-unconfigured | B1 buy_ticket(1) with 0 GEN — event not configured yet | EVENT_NOT_CONFIGURED (0 GEN sent) |

### B. Launch configuration (4) — creator only
| Label | Call | Expected |
|-------|------|----------|
| cfg-e1 | P1 configure_event(1, ORG, ART) | ok, parties_set true |
| cfg-e2 | P1 configure_event(2, ORG, ART) | ok, parties_set true |
| cfg-e3 | P1 configure_event(3, ORG, ART) | ok, parties_set true |
| cfg-e4 | P1 configure_event(4, ORG, ART) | ok, parties_set true |

### C. Primary sales (6) — 10 GEN each, exact price
| Label | Call | Expected |
|-------|------|----------|
| t1-buy | B1 buy_ticket(1) | ok, ticket 1, owner B1, E1 escrow 10 |
| t2-buy | B2 buy_ticket(1) | ok, ticket 2, owner B2, E1 escrow 20 |
| t3-buy | B1 buy_ticket(2) | ok, ticket 3, owner B1, E2 escrow 10 |
| t4-buy | B2 buy_ticket(2) | ok, ticket 4, owner B2, E2 escrow 20 |
| t5-buy | B1 buy_ticket(3) | ok, ticket 5, owner B1, E3 escrow 10 |
| t6-buy | B2 buy_ticket(3) | ok, ticket 6, owner B2, E3 escrow 20 |

### D. Resale happy path (7)
| Label | Call | Expected |
|-------|------|----------|
| r1-list | B1 list_resale(1, 11) | ok, ticket 1 LISTED @ 11 GEN (cap boundary, allowed) |
| r1-buy | B2 buy_resale(1) with 11 GEN | ok, ticket 1 -> B2; B1 credit +9.9 GEN, ART credit +1.1 GEN |
| r2-list | B2 list_resale(2, 10) | ok, ticket 2 LISTED @ 10 GEN |
| r2-buy | B1 buy_resale(2) with 10 GEN | ok, ticket 2 -> B1; B2 credit +9 GEN, ART credit +1 GEN (total 2.1) |
| r3-list | B1 list_resale(3, 11) | ok, ticket 3 LISTED @ 11 GEN; stays LISTED into the CANCELLED settlement (tests the LISTED-refund path) |
| r4-list | B1 list_resale(5, 11) | ok, ticket 5 (E3) LISTED @ 11 GEN (cap boundary, allowed) |
| r4-buy | B2 buy_resale(5) with 11 GEN | ok, ticket 5 -> B2; B1 credit +9.9 GEN, ART credit +1.1 GEN (total 3.2) |

### E. Resale + purchase negatives (8) — exact error codes, 0 GEN on failed payables
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

### F. Early-settlement negative (1)
| Label | Call | Expected error |
|-------|------|----------------|
| neg13-early-settle-e3 | OUT settle_event(3) — E3 date 2026-12-09, today 2026-11-12 | TOO_EARLY, state unchanged (E3 still ON_SALE, settle_count 0, escrow 20) |

### G. Settlements (4) — caller OUT (anyone may settle once the date gate passes; consensus decides)
| Label | Call | Expected |
|-------|------|----------|
| s1-settle-e1 | OUT settle_event(1) | ok, verdict EVENT_HELD; E1 status EVENT_HELD; ORG credit +20 GEN; E1 escrow 0. Retry up to 3x on MAJORITY_DISAGREE; a disagreement leaves everything unchanged. |
| s2-settle-e2 | OUT settle_event(2) | ok, verdict CANCELLED; E2 status CANCELLED; ticket 3 (LISTED, owner B1) REFUNDED +10 GEN; ticket 4 (ACTIVE, owner B2) REFUNDED +10 GEN; E2 escrow 0. Retry up to 3x on MAJORITY_DISAGREE. |
| s3-settle-e4 | OUT settle_event(4) | ok, verdict POSTPONED; E4 status POSTPONED; no money moves (E4 escrow 0, no tickets); settle_count 1. Retry up to 3x on MAJORITY_DISAGREE. |
| s3b-resettle-e4 | OUT settle_event(4) again | ok, verdict POSTPONED again; E4 stays POSTPONED; no money moves; settle_count 2. Proves a postponed event can be re-settled. |

E3 is deliberately NOT settled in this run: its real date (2026-12-09)
is in the future and the on-chain date gate refuses settlement
before 2026-12-10 (proven by neg13). It stays ON_SALE with 6 of 8
tickets unsold after the scripted run, so the live site keeps a
real usable flow (buy / list / buy-resale / withdraw).

### H. Post-settlement negatives (4)
| Label | Call | Expected error |
|-------|------|----------------|
| neg9-double-settle | OUT settle_event(1) — already HELD | EVENT_ALREADY_SETTLED |
| neg11-buy-held | B1 buy_ticket(1) with 0 GEN — event HELD | EVENT_NOT_ON_SALE (0 GEN sent) |
| neg10-list-refunded | B1 list_resale(3, 10) — ticket 3 REFUNDED | TICKET_NOT_ACTIVE |
| neg7-stranger-withdraw | OUT withdraw() — no credit | NO_CREDIT |

### I. Withdrawals (5) — pull-payment, exact credits
| Label | Call | Expected |
|-------|------|----------|
| w-org | ORG withdraw() | ok, 20 GEN (E1 escrow) |
| w-art | ART withdraw() | ok, 3.2 GEN (royalties 1.1 + 1 + 1.1) |
| w-b1 | B1 withdraw() | ok, 29.8 GEN (resale 9.9 + resale 9.9 + refund 10) |
| w-b2 | B2 withdraw() | ok, 19 GEN (resale 9 + refund 10) |
| neg8-double-withdraw | ORG withdraw() again | NO_CREDIT |

## Final readback (exact — scripted run, before any browser pass)

- E1: status EVENT_HELD, verdict EVENT_HELD, tickets_sold 2, escrowed 0, organizer_paid true, settle_count 1.
- E2: status CANCELLED, verdict CANCELLED, tickets_sold 2, escrowed 0, settle_count 1.
- E3: status ON_SALE, verdict '', tickets_sold 2, escrowed 20 GEN, settle_count 0, organizer_paid false.
- E4: status POSTPONED, verdict POSTPONED, tickets_sold 0, escrowed 0, settle_count 2, organizer_paid false.
- Tickets: 1 ACTIVE owner B2 (E1); 2 ACTIVE owner B1 (E1); 3 REFUNDED owner B1 (E2); 4 REFUNDED owner B2 (E2); 5 ACTIVE owner B2 (E3); 6 ACTIVE owner B2 (E3).
- Credits after all withdrawals: P1 0, ORG 0, ART 0, B1 0, B2 0, OUT 0.
- Counts: event_count 4, ticket_count 6, total_received_wei 92 GEN
  (primary 60 + resales 32), total_withdrawn_wei 72 GEN,
  contract_balance_wei 20 GEN, escrowed_wei 20 GEN,
  total_royalties_wei 3.2 GEN, total_resale_volume_wei 32 GEN.
- Ledger: 92 GEN in = 72 GEN withdrawn + 20 GEN balance (E3 live
  escrow, 2 tickets x 10 GEN) — every failed-payable negative sent
  0 GEN by design.
- Ledger, split:
  - Settled events (E1+E2): 40 GEN primary in, 21 GEN resales in,
    61 GEN withdrawn out, balance 0, escrow 0 — fully closed.
  - Live event (E3): 20 GEN primary in (tickets 5+6), 11 GEN
    resale in, 11 GEN of the scripted resale withdrawn as credits
    (9.9 seller + 1.1 royalty), 20 GEN still escrowed in the
    contract — that is E3's open ticket escrow for a future show,
    NOT stranded value.
  - Postponed event (E4): 0 GEN in, 0 out, 0 escrow — the
    POSTPONED branch moves no money by design.

## Honest note on failed payables

A failed payable call keeps its value in the contract (platform
behavior on Studionet). Every failed-payable negative in this run
(neg12, neg6-buy, neg5, neg2, neg1, neg11) sends 0 GEN, so no value
can be stranded. The verify script re-reads the full state before
and after each negative and fails the run if anything changed.

## Not covered by on-chain evidence in v1.2

- SOLD_OUT: no on-chain case. Buying all 8 E3 tickets would close
  the live site's only buyable event, so the sold-out path is
  covered by mock tests only (status flips to SOLD_OUT at 8/8,
  further buys fail). Documented as a known gap, not hidden.
- UNREACHABLE / SOURCES_DISAGREE settle outcomes: fail-closed
  branches with no state change; they occur only if a source fetch
  fails, a source fails the identity check, or the sources
  disagree, which the probe shows does not happen for these eight
  URLs right now. Covered by mock tests.
- E3 settlement: E3's real date is 2026-12-09, in the future. It
  is not settled in this run by design; an early attempt is
  refused on-chain (neg13, TOO_EARLY). Its escrow (20 GEN) stays
  open until after the real date, when it can be settled like
  E1/E2. The organizer key is retained (see Accounts) so the
  organizer credit can be withdrawn after that settlement.

## Browser write loop (pre-registered before the browser run)

The reviewer pass runs on the live site with in-browser temporary
test accounts. Do NOT press settle on E3: its settle button is
disabled until the day after its show date (2026-12-10) and the
contract gate refuses any earlier settlement anyway. E1/E2 are
already settled; E4 is POSTPONED and its settle button stays
disabled in the UI (already settled — re-settlement is proven
on-chain by s3b, and would only matter once a new date is
announced).

| Step | Expected |
|------|----------|
| Cold start, no wallet | Page renders in English by default; before any FINALIZED readback the values are dashes + UNCONFIRMED and export is disabled; contract address is exactly 0x38b0aE26d0C6DE7F5C8418368a2dc10f4d843E5E. E1's poster shows HELD (never the raw text EVENT_HELD and never a raw key like app.status_EVENT_HELD); its Buy button is disabled; E1/E2/E4 carry a settled-historical-demo tag. E3's settle button is disabled with the note that settlement opens the day after the show date. After readback: 4 events, 6 tickets, 20 GEN escrow. |
| Temp account buys 1 E3 ticket | 10 GEN escrowed, ticket #7, ACTIVE, FINALIZED. |
| Same account lists ticket #7 for resale at 11 GEN | LISTED at 11 GEN (the cap, included), FINALIZED. |
| Second temp account buys the resale | 11 GEN paid, ticket #7 owner changes, ACTIVE; seller credit 9.9 GEN; artist credit 1.1 GEN; FINALIZED. |
| Seller withdraws the seller credit in-browser | 9.9 GEN withdrawn, FINALIZED; credit then shows withdrawn. |

## Browser write loop — actual (2026-11-12 15:13–15:22 CST)

All pre-registered expectations met. Buy 0x2faacd425628126f9bc27b32694be5ff7a181ef1df805eedf12f725355d1ce5a;
list 0x658a1050c22b018fa57927167b082892f929fb1d162e1e5961887764daea72f7;
resale buy 0x2d9366ea3caeb3456033268696f0bde21b015541371678c7a43594989fbb2b79;
seller withdraw 0x0abf83648acb6544b9b25736be4db2d1606c47455878678e11cc68836e6ba145
(all FINALIZED). Final readback after the loop: 113 GEN in, 81.9 out,
31.1 balance, 30 escrow, 4.3 royalties, 43 resale, 7 tickets, E3 3/8.
The 1.1 GEN artist royalty was then withdrawn by the artist account
(0x4a296ef1561b1bff58e3f9539af434073430b724910a5c2bd9e50164fceac7f7,
FINALIZED): final ledger 113 in = 83 out + 30 balance (E3 escrow only),
all credits 0. Defect found: the browser history list showed stale
records from the superseded v1.1 deployment; fixed by scoping the
history keys to the contract address (frontend-only fix, rebuilt and
pushed; re-checked by a fresh cold start).
