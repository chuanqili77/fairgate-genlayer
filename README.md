# FairGate — anti-scalper concert tickets with consensus event-outcome settlement

Live site: https://chuanqili77.github.io/fairgate-genlayer/

FairGate sells concert tickets as on-chain stubs with a hard resale
cap, and settles the escrowed ticket money by consensus on what
actually happened to the show. Face price is 10 GEN per ticket.
Resale is capped at 110% of face value (11 GEN, enforced in code)
and every secondary sale pays a 10% artist royalty. When the event
is settled, validators independently fetch the venue's official
event page and an independent listing, and agree on one of three
verdicts: EVENT_HELD pays the organizer, CANCELLED refunds every
current ticket holder in full, POSTPONED holds the funds for
re-settlement on a new date.

## Contract

- Address: [0x1001588861d740A600497523C56Fe96fd425A620](https://explorer-studio.genlayer.com/address/0x1001588861d740A600497523C56Fe96fd425A620)
- Protocol: fairgate-1.1
- Source SHA-256: `e594e59d0cd157e22c518e19340c16ce12e27aa9ef5ea68eaa58674699ca397c`
- Deploy tx: [0xf26a96cf2c6c2963a31f57d92a45156a649d650305b3027bd11b5d2c5e65bee0](https://explorer-studio.genlayer.com/tx/0xf26a96cf2c6c2963a31f57d92a45156a649d650305b3027bd11b5d2c5e65bee0)
- Network: GenLayer Stable Studionet (chain 61999)
- Byte parity: `node scripts/byte_parity.mjs` (deployed code == repo source, byte for byte)

v1 (fairgate-1, `0x6b42859c…`) verified clean but is superseded:
both its events were already settled, so the live site had no
writable on-chain flow left for a new user. v1's contract and
evidence are archived unchanged in `evidence/v1/`. v1.1 adds a
third, live event (E3) on a new contract.

## The three launch events

v1.1 ships exactly three real concerts, fixed in the contract source.
Nobody — including the organizer address — can change the source
URLs the consensus reads. That is the design: the beneficiary
cannot pick its own evidence.

| Event | Date | Source A (venue official) | Source B (independent) | Verdict |
|-------|------|---------------------------|------------------------|---------|
| Oasis Live '25, Wembley Stadium, London | 25 July 2025 | [wembleystadium.com](http://www.wembleystadium.com/events/2025/OASIS) | [wembleypark.com](https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/) — district guide, states "Oasis played Wembley Stadium in 2025" | EVENT_HELD |
| Future & Metro Boomin – We Trust You Tour, Bridgestone Arena, Nashville | 6 August 2024, 8:00 PM | [bridgestonearena.com](https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour) — titled "CANCELLED: …" | [do615.com](https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets) — Nashville independent event calendar, titled "Cancelled - …" | CANCELLED |
| Pentatonix: Christmas in the City Tour, Bridgestone Arena, Nashville | 9 December 2026, 7:00 PM | [bridgestonearena.com](https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour) | [do615.com](https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets) — Nashville independent event calendar | ON_SALE (live — settlement pending the real date) |

## How the verdict is decided (no LLM)

Each validator fetches both source pages and scans the raw body,
lowercased, for two word sets: cancel words ("cancelled",
"canceled") and postpone words (stems "postpone", "reschedule").
The equivalence vector is (verdict, cancel_a, cancel_b,
postpone_a, postpone_b, fetch_a_ok, fetch_b_ok) — exact equality,
no tolerance.

- Both sources fetched, neither word in either → EVENT_HELD.
- Both sources contain a cancel word → CANCELLED.
- Both sources contain a postpone word → POSTPONED.
- Either source fails to fetch → UNREACHABLE (no state change, retryable).
- Sources disagree → SOURCES_DISAGREE (no state change, retryable).

HELD has no explicit "held" word on either source page: the rule
defines HELD as "both sources fetched, neither says cancelled or
postponed". Before the contract was written, a probe contract had
validators fetch all four v1 pages live: Wembley official (200,
126,071 chars, none of the four words), Wembley Park (200,
154,962 chars, none of the four words), Bridgestone (200,
105,253 chars, cancel words only), do615 (200, 62,652 chars,
cancel words only). Bandsintown returned 403 to validators and
was dropped as a source. The E3 pages were probe-verified the
same way before v1.1: Bridgestone Pentatonix (200, 101,205 chars,
none of the four words — not even the bare "cancel" substring),
do615 Pentatonix (200, 52,158 chars, none of the four words).

Fetched page text is data, never instructions: only the four
keyword flags are examined, so instruction text inside a page
cannot change the verdict.

## Money flow

- Primary sale: buyer pays exactly 10 GEN; the money is escrowed.
- Resale: owner lists at 1–11 GEN; buyer pays the exact price.
  Royalty = price × 10 / 100 (exact in wei for whole-GEN prices);
  the seller receives price − royalty. At 11 GEN the royalty is
  1.1 GEN and the seller receives 9.9 GEN.
- Settlement and resale only record pull-payment credits; the
  entitled party withdraws with `withdraw()`. A failed payable
  call keeps its value on Studionet, so the evidence run sends
  0 GEN on every failed-payable negative. The settled events
  close to zero escrow; the 20 GEN contract balance is exactly
  E3's open ticket escrow for a future show — live money, not
  stranded value.
- On CANCELLED, every current ticket holder (including a ticket
  sitting on a resale listing) is refunded the full 10 GEN face
  price. On POSTPONED, funds stay locked and the event can be
  settled again.

## Evidence

- `EXPECTED.md` — every evidence case pre-registered before the run.
- `evidence/transactions.json` — all 35 evidence transactions
  (3 launch configurations, 6 primary sales, 7 resale steps,
  8 resale/purchase negatives, 2 settlements, 4 post-settlement
  negatives, 5 withdrawals) + deploy tx, all FINALIZED.
- `EVIDENCE.md` — final readback, ledger, adversarial table.
- `REVIEWER.md` — one-page reviewer entry: claim, anchors,
  contract, every transaction hash with explorer links,
  adversarial cases, what this project does not prove.
- `node scripts/verify_evidence.mjs` — re-reads every recorded
  transaction live and re-checks the final readback against
  EXPECTED.md. `python3 tests/test_fairgate_mock.py` — deterministic
  rule tests (keyword scan, verdict mapping, royalty, cap,
  injection).

Final ledger: 92 GEN in = 72 GEN withdrawn + 20 GEN live E3 escrow,
contract balance 20 GEN (= E3 escrowed_wei), royalties 3.2 GEN,
resale volume 32 GEN. Settled events (E1+E2) close at 61 GEN in =
61 GEN out, balance 0.

## Usage

```bash
npm install
node scripts/deploy_studionet.mjs   # deploy (writes evidence/deployment.json)
node scripts/run_evidence.mjs       # evidence run (resumable via checkpoint)
node scripts/verify_evidence.mjs    # independent verification
node scripts/byte_parity.mjs        # deployed code == repo source
npm test                            # deterministic mock tests
npm run build                       # frontend (served from docs/ via GitHub Pages)
```

Contract entry points: `configure_event`, `buy_ticket`,
`list_resale`, `cancel_resale`, `buy_resale`, `settle_event`,
`withdraw`; views: `get_event`, `get_all_events`, `get_ticket`,
`get_all_tickets`, `get_credit`, `get_counts`, `get_protocol`.

## What this project does not prove

- It does not prove a postponed event settles correctly on-chain:
  v1.1 has no on-chain POSTPONED case (no real postponed concert
  with dual fetchable sources was found during research). The
  branch is implemented in the contract and the frontend and is
  covered by mock tests; it activates on the first rescheduled
  launch event.
- It does not prove the venue pages will keep their current
  wording: the verdict reads the live pages at settlement time.
  If a source page is rewritten, the verdict follows the new text.
- It does not enforce that settlement happens only after the event
  date: Studionet has no clock. E1/E2 already happened, so this
  does not affect them; E3 (9 Dec 2026) is deliberately left
  unsettled until after its real date. A future version with
  organizer-listed events would need a source-URL allowlist and a
  settlement gate.
- It does not prove ticket authenticity at a venue door: the
  on-chain ticket is a payment and settlement record, not a
  venue entry credential.

## Iteration record

- 2026-11-12: fairgate-1 deployed and verified (see evidence/v1/).
  Probe contract (separate deployment) verified all four anchor
  URLs are fetchable by validators and contain exactly the
  expected keywords before the product contract was written.
- 2026-11-12: fairgate-1.1 redeployed and verified (see EVIDENCE.md).
  v1 was superseded because both its events were already settled
  and the live site had no writable on-chain flow left. v1.1 adds
  E3 (Pentatonix, Bridgestone Arena, 9 Dec 2026, ON_SALE), whose
  two sources were probe-verified before deploy (both 200, no
  cancel/postpone words). E3 stays unsettled until after its real
  date; its 20 GEN escrow is live money, disclosed in EXPECTED.md.
