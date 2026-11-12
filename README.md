# FairGate — anti-scalper concert tickets with consensus event-outcome settlement

Current source: **fairgate-1.4 (not deployed)**. The published deployment manifest and Pages may still reference historical V1.3. Historical receipts do not validate the revised payout rule. See [EVIDENCE.md](EVIDENCE.md) and [evidence/source-status.json](evidence/source-status.json).

V1.4 requires each independent source to identify artist, venue and the exact configured date in an explicit past-tense performance sentence. Scheduled listings, negation, conditional copy and tour-wide retrospectives do not authorize organizer release. Insufficient or contradictory evidence leaves funds locked. The E1 fixed sources currently lack exact-date confirmation under this stricter rule. Local tests and build pass; new deployment and live acceptance are outstanding.

The sections below describe the historical V1.3 deployment unless explicitly labeled V1.4. Original V1.3 documentation is preserved byte-for-byte in evidence/v1.3/.

Live site: https://chuanqili77.github.io/fairgate-genlayer/

FairGate sells concert tickets as on-chain stubs with a hard resale
cap, and settles the escrowed ticket money by consensus on what
actually happened to the show. Face price is 10 GEN per ticket.
Resale is capped at 110% of face value (11 GEN, enforced in code)
and every secondary sale pays a 10% artist royalty. When the event
is settled, validators independently fetch the venue's official
event page and an independent source, confirm each page is about
the right event, and agree on one of three verdicts: EVENT_HELD
pays the organizer, CANCELLED refunds every current ticket holder
the 10 GEN face price, POSTPONED holds the funds for re-settlement
on a new date. Settlement is refused on-chain before the day after
the event date (transaction datetime gate).

## Contract

- Address: [0x8883831222208CcbAf34DAcb8ac08f167edA6c6C](https://explorer-studio.genlayer.com/address/0x8883831222208CcbAf34DAcb8ac08f167edA6c6C)
- Protocol: fairgate-1.3
- Source SHA-256: `dfca9b07359070883cf592df0b451dd8f7f4c37ea426760f50a2d0591c8775c5`
- Deploy tx: [0xaaf1e0d5764a083372676cc667eb89bc8ddefa8cd624a80866ab597841e7ef3b](https://explorer-studio.genlayer.com/tx/0xaaf1e0d5764a083372676cc667eb89bc8ddefa8cd624a80866ab597841e7ef3b)
- Network: GenLayer Stable Studionet (chain 61999)
- Byte parity: `node scripts/byte_parity.mjs` (deployed code == repo source, byte for byte)

v1.2 (fairgate-1.2, `0x38b0aE26…`) verified clean but is superseded:
its settlement gate compared UTC date strings, so an evening show
could have been settled hours before the local day ended; a
POSTPONED event had no safe way to move to a new date; and the
verdict scanned the whole raw page, so an unrelated cancel word
in a footer or a recommended article could influence the result.
v1.2's contract and evidence are archived in `evidence/v1.2/`.
v1.1 (fairgate-1.1, `0x10015888…`) is archived in `evidence/v1.1/`,
v1 (fairgate-1) in `evidence/v1/`.

## The four launch events

v1.3 ships exactly four real concerts, fixed in the contract source.
Nobody — including the organizer address — can change the source
URLs the consensus reads. That is the design: the beneficiary
cannot pick its own evidence. Only the deployer (recorded as
`creator` at construction) can configure an event's organizer and
artist addresses, once, before the first ticket is sold.

| Event | Date | Source A (venue official) | Source B (independent) | Verdict |
|-------|------|---------------------------|------------------------|---------|
| Oasis Live '25, Wembley Stadium, London | 25 July 2025 | [wembleystadium.com](http://www.wembleystadium.com/events/2025/OASIS) | [wembleypark.com](https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/) — district guide, states "Oasis played Wembley Stadium in 2025" | EVENT_HELD |
| Future & Metro Boomin – We Trust You Tour, Bridgestone Arena, Nashville | 6 August 2024, 8:00 PM | [bridgestonearena.com](https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour) — titled "CANCELLED: …" | [do615.com](https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets) — Nashville independent event calendar, titled "Cancelled - …" | CANCELLED |
| KATSEYE — THE WILDWORLD TOUR, Target Center, Minneapolis | 7 November 2026, 8:00 PM | [targetcenter.com](https://www.targetcenter.com/events/detail/katseye) — titled "KATSEYE - POSTPONED" | [musictimes.com](https://www.musictimes.com/articles/113245/20261109/katseye-postpone-chicago-minneapolis-shows-megan-recovers-concussion.htm) — independent news report confirming the postponement | POSTPONED |
| Pentatonix: Christmas in the City Tour, Bridgestone Arena, Nashville | 9 December 2026, 7:00 PM CST | [bridgestonearena.com](https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour) | [do615.com](https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets) — Nashville independent event calendar | ON_SALE (live — settlement opens 2026-12-10 06:00 UTC) |

E4's second source is an independent news report rather than an
event listing: no independent listing with postponement wording
was fetchable (the Minneapolis listing site was unreachable and
the ticket-aggregator page returned 403 to validators). That is
disclosed in the contract and in EXPECTED.md, not hidden.

## How the verdict is decided (no LLM)

Each validator fetches both source pages and reads only scoped
text: the page title, meta content (description / keywords),
JSON-LD structured event data, and the visible body text after
removing navigation, footers, asides, scripts, styles and
recommended / related / sidebar sections. A cancel word in a
footer or a recommended article about another event cannot
influence the verdict — only text about the target event counts.
Before any keyword counts, each page must confirm it is the right
event: the scoped text must contain the artist token AND the
venue token for that event (oasis + wembley; metro boomin +
bridgestone; katseye + target center; pentatonix + bridgestone).
A page that fails the identity check cannot vote: its keywords
are ignored and the verdict is UNREACHABLE. Then the keyword
rule applies: cancel words ("cancelled", "canceled") and
postpone words (stems "postpone", "reschedule"). The equivalence
vector is (verdict, cancel_a, cancel_b, postpone_a, postpone_b,
fetch_a_ok, fetch_b_ok, identity_a, identity_b) — exact equality,
no tolerance.

- Both sources fetched, identity confirmed, neither word in either → EVENT_HELD.
- Both sources contain a cancel word → CANCELLED.
- Both sources contain a postpone word → POSTPONED.
- Either source fails to fetch, or fails the identity check → UNREACHABLE (no state change, retryable).
- Sources disagree → SOURCES_DISAGREE (no state change, retryable).

HELD has no explicit "held" word on either source page: the rule
defines HELD as "both sources fetched, both confirmed the event,
neither says cancelled or postponed". Before the contract was
written, a probe contract had validators fetch all eight v1.3
pages live with the new scoped extractor: E1a 200 / 126,071
chars, E1b 200 / 154,952 chars, E2a 200 / 105,253 chars (cancel
only), E2b 200 / 62,654 chars (cancel only), E3a 200 / 101,205
chars, E3b 200 / 52,158 chars, E4a 200 / 137,128 chars (postpone
only), E4b 200 / 220,262 chars (postpone only) — every page with
the expected keyword signature and its identity tokens confirmed
in the scoped text. Bandsintown returned 403 to validators and
was dropped as a source. The same probe confirmed the contract
clock: `datetime.now(timezone.utc).timestamp()` returned the
transaction Unix timestamp (1794494284 = 2026-11-12T14:38:04Z),
matching real UTC to the second.

Settlement time gate (on-chain, not frontend time): each event
stores `event_start_ts` and `settle_after_ts` (UTC seconds) plus
its local UTC offset. At configuration the contract derives
`settle_after_ts` itself as the first second of the day after the
show in the event's own local time zone and refuses any other
value (`BAD_SETTLE_AFTER_TS`). `settle_event` reads the
transaction Unix timestamp — GenLayer-native and deterministic
across validators — and requires tx time >= `settle_after_ts`.
An earlier attempt fails with `TOO_EARLY` and changes nothing
(proven on-chain for E3 in the evidence run, and again for E4
after its reschedule). The frontend disables the settle button
until the settlement timestamp as a second layer only.

Rescheduling: `reschedule_event` is creator-only and only for a
POSTPONED event. The new date must be later than the old date and
the new settlement timestamp is re-derived and re-checked the
same way. Tickets, holders and escrow are untouched, no money is
released to organizer or artist, the event stays POSTPONED (sales
do not reopen), and the event can be rescheduled again. Settled
events (HELD / CANCELLED) and ON_SALE events refuse with
`NOT_POSTPONED`.

Fetched page text is data, never instructions: only the keyword
flags and the identity tokens are examined, so instruction text
inside a page cannot change the verdict — and a page that does
not mention the event at all cannot contribute a keyword.

## Money flow

- Primary sale: buyer pays exactly 10 GEN; the money is escrowed.
  Buying requires the event to be configured, ON_SALE, not sold
  out, and the exact face price.
- Resale: owner lists at 1–11 GEN; buyer pays the exact price.
  Royalty = price × 10 / 100 (exact in wei for whole-GEN prices);
  the seller receives price − royalty. At 11 GEN the royalty is
  1.1 GEN and the seller receives 9.9 GEN.
- Settlement and resale only record pull-payment credits; the
  entitled party withdraws with `withdraw()`. A failed payable
  call keeps its value on Studionet, so the evidence run sends
  0 GEN on every failed-payable negative. The settled events
  close to zero escrow; the 30 GEN contract balance is exactly
  live escrow (E3 20 GEN for a future show + E4 10 GEN for a
  postponed show), not stranded value.
- On CANCELLED, every current ticket holder (including a ticket
  sitting on a resale listing) is refunded the 10 GEN face price.
  A resale buyer who paid 11 GEN gets 10 back and loses 1 GEN —
  the refund is the face price, not the price paid. On POSTPONED,
  funds stay locked, the event can be rescheduled to a new date,
  and it can be settled again after the new settlement timestamp.

## Evidence

- `EXPECTED.md` — every evidence case pre-registered before the run.
- `evidence/transactions.json` — all 53 evidence transactions
  (5 pre-configure negatives, 4 launch configurations, 7 primary
  sales, 7 resale steps, 8 resale/purchase negatives, 1 early
  settlement negative, 3 settlements, 6 reschedule negatives +
  2 reschedules + 1 settle-after-reschedule negative,
  4 post-settlement negatives, 5 withdrawals) + deploy tx, all
  FINALIZED.
- `docs/browser-transactions.json` — the five browser write-loop
  transactions (buy / list / buy-resale / seller withdraw /
  artist withdraw) on the live site, re-read live by the verify
  script.
- `EVIDENCE.md` — final readback, ledger, adversarial table.
- `REVIEWER.md` — one-page reviewer entry: claim, anchors,
  contract, every transaction hash with explorer links,
  adversarial cases, what this project does not prove.
- `node scripts/verify_evidence.mjs` — re-reads every recorded
  transaction live (scripted + browser) and re-checks the final
  readback against EXPECTED.md. `python3 tests/test_fairgate_mock.py`
  — deterministic rule tests (scoped extractor and its five
  counterexamples, identity check, verdict mapping, timestamp
  gate with four boundary cases, creator-only configure,
  reschedule rules, cap, royalty, injection).

Final ledger (scripted run, before the browser pass): 102 GEN in =
72 GEN withdrawn + 30 GEN contract balance (E3 20 live escrow +
E4 10 postponed escrow), royalties 3.2 GEN, resale volume 32 GEN.
Settled events (E1+E2) close at 61 GEN in = 61 GEN out, balance 0.
E4 (POSTPONED, rescheduled twice) moves no money: 10 GEN in, 0 out,
10 GEN escrow.

## Usage

```bash
npm install
node scripts/deploy_studionet.mjs   # deploy (writes evidence/deployment.json)
node scripts/run_evidence.mjs       # evidence run (resumable)
node scripts/verify_evidence.mjs    # independent verification
node scripts/byte_parity.mjs        # deployed code == repo source
npm test                            # deterministic mock tests
npm run build                       # frontend (served from docs/ via GitHub Pages)
```

Contract entry points: `configure_event`, `reschedule_event`,
`buy_ticket`, `list_resale`, `cancel_resale`, `buy_resale`,
`settle_event`, `withdraw`; views: `get_event`, `get_all_events`,
`get_ticket`, `get_all_tickets`, `get_credit`, `get_counts`,
`get_protocol`, `get_creator`.

## What this project does not prove

- It does not prove a sold-out event on-chain: buying all 8 E3
  tickets would close the live site's only buyable event, so the
  sold-out path is covered by mock tests only.
- It does not prove the UNREACHABLE / SOURCES_DISAGREE settle
  outcomes on-chain: they are fail-closed branches with no state
  change, covered by mock tests; the probe shows none of the
  eight source URLs fails or disagrees right now.
- It does not prove the venue pages will keep their current
  wording: the verdict reads the live pages at settlement time.
  If a source page is rewritten, the verdict follows the new text.
- It does not settle E3 yet: E3 (9 Dec 2026, 7:00 PM CST) is
  deliberately left unsettled until its settlement timestamp
  (2026-12-10T06:00:00Z), and an early attempt is refused
  on-chain. The organizer key is retained offline by the project
  operator (never committed) so the organizer credit can be
  withdrawn after that settlement.
- It does not prove ticket authenticity at a venue door: the
  on-chain ticket is a payment and settlement record, not a
  venue entry credential.

## Iteration record

- 2026-11-12: fairgate-1 deployed and verified (see evidence/v1/).
  Probe contract (separate deployment) verified all four anchor
  URLs are fetchable by validators and contain exactly the
  expected keywords before the product contract was written.
- 2026-11-12: fairgate-1.1 redeployed and verified (see
  evidence/v1.1/). v1 was superseded because both its events
  were already settled and the live site had no writable on-chain
  flow left. v1.1 adds E3 (Pentatonix, Bridgestone Arena,
  9 Dec 2026, ON_SALE), whose two sources were probe-verified
  before deploy. v1.1 verified clean but is superseded by v1.2:
  permissionless configure, no settlement date gate, and a
  keyword-only verdict.
- 2026-11-12: fairgate-1.2 redeployed and verified (see
  evidence/v1.2/). Creator-only configure, on-chain settlement
  date gate (transaction datetime), identity-anchored verdict,
  and a fourth launch event E4 (KATSEYE, Target Center,
  7 Nov 2026, POSTPONED) proving the postponed branch on-chain.
  All eight source URLs and the contract clock were
  probe-verified before deploy (probe contract 0x6C7Fa707…).
  v1.2 is superseded by v1.3: its date-string gate, its missing
  reschedule path, and its whole-page keyword scan are fixed.
- 2026-11-12: fairgate-1.3 redeployed and verified (see
  EVIDENCE.md). Explicit Unix-timestamp settlement gate with
  contract-side derivation and check (E3 gate exactly
  2026-12-10T06:00:00Z), reschedule_event for POSTPONED events
  (E4 rescheduled twice on-chain, 2027-01-16 then 2027-02-20,
  tickets and escrow untouched), scoped verdict extraction that
  ignores footer / recommended-article noise, and a formal
  browser-transactions evidence file re-read by the verify
  script. All eight source URLs and the contract clock were
  probe-verified before deploy (probe contract 0x247f8fe2…,
  probe3, results in probe-v13-results.json).
