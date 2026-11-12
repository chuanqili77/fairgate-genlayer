# FairGate V1.4 prospective chain test plan

Published before the new V1.4 deployment and test transactions. This is a new run, not a revision of the historical V1.3 registration, which remains byte-identical in evidence/v1.3/EXPECTED.md. The ticket flows, permissions and expected ledger remain the same; canonical source and source anchors are different and require a fresh deployment.

E1 sources are Radio X's original same-day report and Lloyds' dated measured-spending record; both must independently give held=true. E2 uses the venue and JamBase's specific dated concert record. E4 uses Target Center and iHeart's venue-linked postponement report. No source outage, absence of cancellation, conflicting status or Mock fixture can count as EVENT_HELD. E3 remains future-gated; source unavailability must never release its escrow.

Deploy tx: 0xaaf1e0d5764a083372676cc667eb89bc8ddefa8cd624a80866ab597841e7ef3b
Source SHA-256: dfca9b07359070883cf592df0b451dd8f7f4c37ea426760f50a2d0591c8775c5 (41,041 bytes, byte parity TRUE)
Face price 10 GEN per ticket; resale cap 11 GEN (110%, cap included);
artist royalty 10% (price * 10 // 100 in wei, exact for whole-GEN prices).
Four launch events, fixed in the contract source (see README for why
they are fixed, and for the probe results behind the verdict rule).

## Why v1.4 (v1.2 superseded, archived in evidence/v1.2/)

v1.2 (fairgate-1.2, 0x38b0aE26…) verified clean (byte parity TRUE,
verify 78/78, ledger 113 in = 83 out + 30 balance) but had three
defects that are fixed in v1.4:

1. The settlement gate compared UTC date strings against the event
   date. A show that starts in the evening local time could be
   settled hours before the local day ended. v1.4 stores explicit
   Unix timestamps per event (event_start_ts, settle_after_ts) and
   the local UTC offset; the contract derives settle_after_ts
   itself as the first second of the day after the show in the
   event's own local time zone and refuses any other value, and
   settle_event compares the GenLayer transaction Unix timestamp
   against it. No date strings are compared anywhere. E3's gate is
   now exactly 2026-12-10T06:00:00Z (2026-12-10 00:00 Nashville).
2. A POSTPONED event had no safe way to move to a new date: the
   only path was re-settling it, which left the old date and the
   old settlement timestamp in place. v1.4 adds reschedule_event
   (creator only, POSTPONED only, new date later than the old date,
   new settlement timestamp re-derived and re-checked, tickets /
   holders / escrow untouched, no money released, re-reschedulable,
   settled or selling events refused, never reopens sales).
3. The verdict scanned the whole raw page, so a cancelled word in a
   footer or a recommended article about another event could
   influence the result. v1.4 reads only scoped text (page title,
   meta content, JSON-LD structured event data, visible body after
   removing navigation, footers, asides, scripts, styles and
   recommended / related sections). The identity check and the
   keyword flags run on that scoped text only. The E1/E2/E4
   verdicts are unchanged (re-proven on-chain in this run).

v1.4 also makes the browser write loop a formal evidence file
(docs/browser-transactions.json, re-read live by the verify
script) instead of a Markdown-only record. v1.2 history is
preserved unchanged in evidence/v1.2/.

## Events (fixed at deploy)

| ID | Event | Local start | UTC offset | event_start_ts | settle_after_ts (local midnight after) |
|----|-------|-------------|------------|----------------|----------------------------------------|
| E1 | Oasis Live '25, Wembley Stadium, London | 2025-07-25 19:00 BST | +60 | 1753466400 (2025-07-25T18:00:00Z) | 1753484400 (2025-07-25T23:00:00Z = 2026-07-26 00:00 BST) |
| E2 | Future & Metro Boomin – We Trust You Tour, Bridgestone Arena, Nashville | 2024-08-06 20:00 CDT | -300 | 1722992400 (2024-08-07T01:00:00Z) | 1723006800 (2024-08-07T05:00:00Z = 2024-08-07 00:00 CDT) |
| E3 | Pentatonix: Christmas in the City Tour, Bridgestone Arena, Nashville | 2026-12-09 19:00 CST | -360 | 1796864400 (2026-12-10T01:00:00Z) | 1796882400 (2026-12-10T06:00:00Z = 2026-12-10 00:00 CST) |
| E4 | KATSEYE — THE WILDWORLD TOUR, Target Center, Minneapolis | 2026-11-07 20:00 CST | -360 | 1794103200 (2026-11-08T02:00:00Z) | 1794117600 (2026-11-08T06:00:00Z = 2026-11-08 00:00 CST) |

Offsets verified against the IANA zone (Europe/London,
America/Chicago) for each event date. Sources and expected
verdicts are unchanged from v1.2:

| ID | Source A (venue official) | Source B (independent) | Expected verdict |
|----|---------------------------|------------------------|------------------|
| E1 | http://www.wembleystadium.com/events/2025/OASIS | https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/ ("Oasis played Wembley Stadium in 2025") | EVENT_HELD |
| E2 | https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour ("CANCELLED: … has been cancelled") | https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets ("Cancelled - …", "Past(08/6/2024)") | CANCELLED |
| E3 | https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour | https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets | NOT SETTLED in this run (live event, ON_SALE; timestamp gate refuses settlement before 2026-12-10T06:00:00Z) |
| E4 | https://www.targetcenter.com/events/detail/katseye (title "KATSEYE - POSTPONED \| Target Center") | https://www.musictimes.com/articles/113245/20261109/katseye-postpone-chicago-minneapolis-shows-megan-recovers-concussion.htm (independent news report, postponement confirmed) | POSTPONED |

Verdict rule (deterministic, no LLM): each validator fetches both
sources and reads ONLY the scoped text — page title, meta content
(description / keywords), JSON-LD structured event data, and the
visible body text after removing navigation, footers, asides,
scripts, styles and recommended / related / sidebar sections.
Cancel words: "cancelled", "canceled". Postpone words: stems
"postpone", "reschedule" (also match "postponed", "postponement",
"rescheduled", "rescheduling"). Identity check first: the scoped
text must contain the artist token AND the venue token for the
event (E1: oasis + wembley; E2: metro boomin + bridgestone; E3:
pentatonix + bridgestone; E4: katseye + target center). A source
that fails to fetch, or fails the identity check, cannot vote: the
verdict is UNREACHABLE (no state change). Both sources fetched OK
+ identity confirmed + no cancel/postpone word in either =
EVENT_HELD. Both sources contain a cancel word = CANCELLED. Both
contain a postpone word = POSTPONED. Sources disagree =
SOURCES_DISAGREE (no state change). Equivalence vector is
(verdict, cancel_a, cancel_b, postpone_a, postpone_b, fetch_a_ok,
fetch_b_ok, identity_a, identity_b), exact equality.

Settlement time gate (on-chain): settle_event reads the
transaction datetime (GenLayer-native, deterministic), converts it
to a Unix timestamp and requires tx_ts >= settle_after_ts. An
earlier attempt fails with TOO_EARLY, state unchanged. The
contract derives settle_after_ts from event_start_ts and the
local UTC offset at configuration and refuses any other value.

Probe results (probe contract, validators fetching live — NOT the
product evidence): clock check — datetime.now(timezone.utc)
.timestamp() returns the transaction Unix timestamp; all eight
anchor URLs probed with the scoped extractor report exactly the
expected signature (E1a/E1b no keywords + identity, E2a/E2b cancel
only + identity, E3a/E3b no keywords + identity, E4a/E4b postpone
only + identity). Full probe output in probe-v13-results.json.

## Accounts (temporary, evidence run only)

P1 = deployer and creator (only P1 can configure events and
reschedule them). ORG = organizer payout address, ART = artist
payout address, B1/B2 = buyers, OUT = stranger (negative caller).
ORG/ART are set once per event by configure_event before the first
ticket sale. The ORG key is RETAINED after this run (held offline
by the project operator, never committed) because E3's organizer
credit can only be withdrawn after E3 settles after 2026-12-09;
it is deleted after that withdrawal.

## Evidence flow (53 txs + deploy = 54)

### A. Pre-configure negatives (5) — exact error codes, 0 GEN on failed payables
| Label | Call | Expected error |
|-------|------|----------------|
| neg0-not-creator | OUT configure_event(1, ORG, ART, 1753466400, 1753484400, 60, 'Europe/London') — not the creator | NOT_CREATOR |
| neg14-bad-address | P1 configure_event(1, '0x123', ART, …) — malformed address | BAD_ADDRESS |
| neg15-bad-settle-after | P1 configure_event(1, ORG, ART, 1753466400, 1753484400+3600, 60, …) — settlement timestamp 1 hour late | BAD_SETTLE_AFTER_TS |
| neg16-bad-tz-offset | P1 configure_event(1, ORG, ART, 1753466400, 1753484400, 9999, …) — offset out of range | BAD_TZ_OFFSET |
| neg12-buy-unconfigured | B1 buy_ticket(1) with 0 GEN — event not configured yet | EVENT_NOT_CONFIGURED (0 GEN sent) |

### B. Launch configuration (4) — creator only, explicit timestamps
| Label | Call | Expected |
|-------|------|----------|
| cfg-e1 | P1 configure_event(1, ORG, ART, 1753466400, 1753484400, 60, 'Europe/London') | ok, parties_set true, timestamps stored |
| cfg-e2 | P1 configure_event(2, ORG, ART, 1722992400, 1723006800, -300, 'America/Chicago') | ok, parties_set true, timestamps stored |
| cfg-e3 | P1 configure_event(3, ORG, ART, 1796864400, 1796882400, -360, 'America/Chicago') | ok, parties_set true, timestamps stored |
| cfg-e4 | P1 configure_event(4, ORG, ART, 1794103200, 1794117600, -360, 'America/Chicago') | ok, parties_set true, timestamps stored |

### C. Primary sales (7) — 10 GEN each, exact price
| Label | Call | Expected |
|-------|------|----------|
| t1-buy | B1 buy_ticket(1) | ok, ticket 1, owner B1, E1 escrow 10 |
| t2-buy | B2 buy_ticket(1) | ok, ticket 2, owner B2, E1 escrow 20 |
| t3-buy | B1 buy_ticket(2) | ok, ticket 3, owner B1, E2 escrow 10 |
| t4-buy | B2 buy_ticket(2) | ok, ticket 4, owner B2, E2 escrow 20 |
| t5-buy | B1 buy_ticket(3) | ok, ticket 5, owner B1, E3 escrow 10 |
| t6-buy | B2 buy_ticket(3) | ok, ticket 6, owner B2, E3 escrow 20 |
| t7-buy | B1 buy_ticket(4) | ok, ticket 7, owner B1, E4 escrow 10 (E4 sells one ticket so rescheduling is proven against a real ticket, holder and escrow) |

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
| neg13-early-settle-e3 | OUT settle_event(3) — E3 settlement timestamp 2026-12-10T06:00:00Z, tx time 2026-11-12 | TOO_EARLY, state unchanged (E3 still ON_SALE, settle_count 0, escrow 20) |

### G. Settlements (3) — caller OUT (anyone may settle once the timestamp gate passes; consensus decides)
| Label | Call | Expected |
|-------|------|----------|
| s1-settle-e1 | OUT settle_event(1) | ok, verdict EVENT_HELD; E1 status EVENT_HELD; ORG credit +20 GEN; E1 escrow 0. Retry up to 3x on MAJORITY_DISAGREE; a disagreement leaves everything unchanged. |
| s2-settle-e2 | OUT settle_event(2) | ok, verdict CANCELLED; E2 status CANCELLED; ticket 3 (LISTED, owner B1) REFUNDED +10 GEN; ticket 4 (ACTIVE, owner B2) REFUNDED +10 GEN; E2 escrow 0. Retry up to 3x on MAJORITY_DISAGREE. |
| s3-settle-e4 | OUT settle_event(4) | ok, verdict POSTPONED; E4 status POSTPONED; no money moves (ticket 7 stays ACTIVE, escrow stays 10 GEN); settle_count 1. Retry up to 3x on MAJORITY_DISAGREE. |

E3 is deliberately NOT settled in this run: its settlement
timestamp (2026-12-10T06:00:00Z) is in the future and the on-chain
timestamp gate refuses settlement before it (proven by neg13). It
stays ON_SALE with 6 of 8 tickets unsold after the scripted run, so
the live site keeps a real usable flow (buy / list / buy-resale /
withdraw).

### H. Reschedule (9) — negatives, two reschedules, settle under the new timestamp
| Label | Call | Expected |
|-------|------|----------|
| neg18-rsch-stranger | OUT reschedule_event(4, 1800151200, 1800165600, -360, '2027-01-16', '16 January 2027, 8:00 PM', 'America/Chicago') — not the creator | NOT_CREATOR |
| neg19-rsch-onsale | P1 reschedule_event(3, …) — E3 is ON_SALE, not postponed | NOT_POSTPONED |
| neg20-rsch-earlier | P1 reschedule_event(4, 1793584800, 1793599200, -360, '2026-11-01', …) — new date earlier than 2026-11-07 | DATE_NOT_LATER |
| neg21-rsch-settled-e1 | P1 reschedule_event(1, …) — E1 already HELD | NOT_POSTPONED |
| neg22-rsch-settled-e2 | P1 reschedule_event(2, …) — E2 already CANCELLED | NOT_POSTPONED |
| neg23-rsch-bad-settle | P1 reschedule_event(4, 1800151200, 1800165601, -360, …) — settlement timestamp 1 second late | BAD_SETTLE_AFTER_TS |
| rsch1 | P1 reschedule_event(4, 1800151200, 1800165600, -360, '2027-01-16', '16 January 2027, 8:00 PM', 'America/Chicago') | ok; E4 stays POSTPONED, date 2027-01-16, timestamps stored; ticket 7 ACTIVE owner B1, escrow 10 GEN, no credit to ORG/ART, settle_count 1 |
| rsch2 | P1 reschedule_event(4, 1803175200, 1803189600, -360, '2027-02-20', '20 February 2027, 8:00 PM', 'America/Chicago') | ok; E4 stays POSTPONED, date 2027-02-20, timestamps stored; ticket 7 ACTIVE owner B1, escrow 10 GEN, no credit to ORG/ART, settle_count 1 (second reschedule proves re-rescheduling works) |
| neg17-settle-after-rsch | OUT settle_event(4) — E4's new settlement timestamp is 2027-02-21T06:00:00Z | TOO_EARLY, state unchanged (E4 still POSTPONED, settle_count 1) |

### I. Post-settlement negatives (4)
| Label | Call | Expected error |
|-------|------|----------------|
| neg9-double-settle | OUT settle_event(1) — already HELD | EVENT_ALREADY_SETTLED |
| neg11-buy-held | B1 buy_ticket(1) with 0 GEN — event HELD | EVENT_NOT_ON_SALE (0 GEN sent) |
| neg10-list-refunded | B1 list_resale(3, 10) — ticket 3 REFUNDED | TICKET_NOT_ACTIVE |
| neg7-stranger-withdraw | OUT withdraw() — no credit | NO_CREDIT |

### J. Withdrawals (5) — pull-payment, exact credits
| Label | Call | Expected |
|-------|------|----------|
| w-org | ORG withdraw() | ok, 20 GEN (E1 escrow) |
| w-art | ART withdraw() | ok, 3.2 GEN (royalties 1.1 + 1 + 1.1) |
| w-b1 | B1 withdraw() | ok, 29.8 GEN (resale 9.9 + resale 9.9 + refund 10) |
| w-b2 | B2 withdraw() | ok, 19 GEN (resale 9 + refund 10) |
| neg8-double-withdraw | ORG withdraw() again | NO_CREDIT |

## Final readback (exact — scripted run, before any browser pass)

- E1: status EVENT_HELD, verdict EVENT_HELD, tickets_sold 2, escrowed 0, organizer_paid true, settle_count 1, event_start_ts 1753466400, settle_after_ts 1753484400, tz_offset_min 60.
- E2: status CANCELLED, verdict CANCELLED, tickets_sold 2, escrowed 0, settle_count 1, event_start_ts 1722992400, settle_after_ts 1723006800, tz_offset_min -300.
- E3: status ON_SALE, verdict '', tickets_sold 2, escrowed 20 GEN, settle_count 0, organizer_paid false, event_start_ts 1796864400, settle_after_ts 1796882400, tz_offset_min -360.
- E4: status POSTPONED, verdict POSTPONED, tickets_sold 1, escrowed 10 GEN, settle_count 1, organizer_paid false, event_start_ts 1803175200, settle_after_ts 1803189600, tz_offset_min -360, date_iso '2027-02-20'.
- Tickets: 1 ACTIVE owner B2 (E1); 2 ACTIVE owner B1 (E1); 3 REFUNDED owner B1 (E2); 4 REFUNDED owner B2 (E2); 5 ACTIVE owner B2 (E3); 6 ACTIVE owner B2 (E3); 7 ACTIVE owner B1 (E4).
- Credits after all withdrawals: P1 0, ORG 0, ART 0, B1 0, B2 0, OUT 0.
- Counts: event_count 4, ticket_count 7, total_received_wei 102 GEN
  (primary 70 + resales 32), total_withdrawn_wei 72 GEN,
  contract_balance_wei 30 GEN, escrowed_wei 30 GEN,
  total_royalties_wei 3.2 GEN, total_resale_volume_wei 32 GEN.
- Ledger: 102 GEN in = 72 GEN withdrawn + 30 GEN balance (E3 20
  live escrow + E4 10 postponed escrow) — every failed-payable
  negative sent 0 GEN by design.
- Ledger, split:
  - Settled events (E1+E2): 40 GEN primary in, 21 GEN resales in,
    61 GEN withdrawn out, balance 0, escrow 0 — fully closed.
  - Live event (E3): 20 GEN primary in (tickets 5+6), 11 GEN
    resale in, 11 GEN of the scripted resale withdrawn as credits
    (9.9 seller + 1.1 royalty), 20 GEN still escrowed in the
    contract — that is E3's open ticket escrow for a future show,
    NOT stranded value.
  - Postponed event (E4): 10 GEN primary in (ticket 7), 0 out,
    10 GEN escrowed — the POSTPONED branch and both reschedules
    move no money by design.

## Honest note on failed payables

A failed payable call keeps its value in the contract (platform
behavior on Studionet). Every failed-payable negative in this run
(neg12, neg6-buy, neg5, neg2, neg1, neg11) sends 0 GEN, so no value
can be stranded. The verify script re-reads the full state before
and after each negative and fails the run if anything changed.

## Not covered by on-chain evidence in v1.4

- SOLD_OUT: no on-chain case. Buying all 8 E3 tickets would close
  the live site's only buyable event, so the sold-out path is
  covered by mock tests only (status flips to SOLD_OUT at 8/8,
  further buys fail). Documented as a known gap, not hidden.
- UNREACHABLE / SOURCES_DISAGREE settle outcomes: fail-closed
  branches with no state change; they occur only if a source fetch
  fails, a source fails the identity check, or the sources
  disagree, which the probe shows does not happen for these eight
  URLs right now. Covered by mock tests.
- E3 settlement: E3's real date is 2026-12-09 19:00 Nashville, in
  the future. It is not settled in this run by design; an early
  attempt is refused on-chain (neg13, TOO_EARLY). Its escrow
  (20 GEN) stays open until its settlement timestamp
  (2026-12-10T06:00:00Z), when it can be settled like E1/E2. The
  organizer key is retained (see Accounts) so the organizer credit
  can be withdrawn after that settlement.

## Browser write loop (pre-registered before the browser run)

The reviewer pass runs on the live site with in-browser temporary
test accounts. Do NOT press settle on E3: its settle button is
disabled until its settlement timestamp (2026-12-10T06:00:00Z) and
the contract gate refuses any earlier settlement anyway. E1/E2 are
already settled; E4 is POSTPONED and rescheduled to 2027-02-20,
and its settle button stays disabled in the UI (its new settlement
timestamp is 2027-02-21T06:00:00Z).

| Step | Expected |
|------|----------|
| Cold start, no wallet | Page renders in English by default; before any FINALIZED readback the values are dashes + UNCONFIRMED and export is disabled; contract address is exactly 0x8883831222208CcbAf34DAcb8ac08f167edA6c6C. E1's poster shows HELD (never the raw text EVENT_HELD and never a raw key like app.status_EVENT_HELD); its Buy button is disabled; E1/E2/E4 carry a settled-historical-demo tag. E3's settle button is disabled with the note that settlement opens 2026-12-10 06:00 UTC. After readback: 4 events, 7 tickets, 30 GEN escrow. |
| Temp account buys 1 E3 ticket | 10 GEN escrowed, ticket #8, ACTIVE, FINALIZED. |
| Same account lists ticket #8 for resale at 11 GEN | LISTED at 11 GEN (the cap, included), FINALIZED. |
| Second temp account buys the resale | 11 GEN paid, ticket #8 owner changes, ACTIVE; seller credit 9.9 GEN; artist credit 1.1 GEN; FINALIZED. |
| Seller withdraws the seller credit in-browser | 9.9 GEN withdrawn, FINALIZED; credit then shows withdrawn. |
| Artist withdraws the artist credit in-browser | 1.1 GEN withdrawn, FINALIZED; credit then shows withdrawn. |

Post-browser ledger: 123 GEN in, 83 GEN out, 40 GEN balance
(E3 30 + E4 10 escrow), royalties 4.3 GEN, resale volume 43 GEN,
8 tickets, E3 3/8 sold. All five browser transactions are recorded
in docs/browser-transactions.json and re-read live by
scripts/verify_evidence.mjs.
