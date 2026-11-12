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

- Address: [0x6b42859cA5ef671F8DC27A191E450cCe8B9cAE12](https://explorer-studio.genlayer.com/address/0x6b42859cA5ef671F8DC27A191E450cCe8B9cAE12)
- Protocol: fairgate-1
- Source SHA-256: `1d2201c7dac9385b86f5a74f711acd076c68d7cef75604cc06fd42c1b0f5cb7c`
- Deploy tx: [0x61fea80782dddb0ba36846527980da80f32c062afeea8bb64c900443e5285c93](https://explorer-studio.genlayer.com/tx/0x61fea80782dddb0ba36846527980da80f32c062afeea8bb64c900443e5285c93)
- Network: GenLayer Stable Studionet (chain 61999)
- Byte parity: `node scripts/byte_parity.mjs` (deployed code == repo source, byte for byte)

## The two launch events

v1 ships exactly two real concerts, fixed in the contract source.
Nobody — including the organizer address — can change the source
URLs the consensus reads. That is the design: the beneficiary
cannot pick its own evidence.

| Event | Date | Source A (venue official) | Source B (independent) | Verdict |
|-------|------|---------------------------|------------------------|---------|
| Oasis Live '25, Wembley Stadium, London | 25 July 2025 | [wembleystadium.com](http://www.wembleystadium.com/events/2025/OASIS) | [wembleypark.com](https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/) — district guide, states "Oasis played Wembley Stadium in 2025" | EVENT_HELD |
| Future & Metro Boomin – We Trust You Tour, Bridgestone Arena, Nashville | 6 August 2024, 8:00 PM | [bridgestonearena.com](https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour) — titled "CANCELLED: …" | [do615.com](https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets) — Nashville independent event calendar, titled "Cancelled - …" | CANCELLED |

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
validators fetch all four pages live: Wembley official (200,
126,071 chars, none of the four words), Wembley Park (200,
154,962 chars, none of the four words), Bridgestone (200,
105,253 chars, cancel words only), do615 (200, 62,652 chars,
cancel words only). Bandsintown returned 403 to validators and
was dropped as a source.

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
  0 GEN on every failed-payable negative and the final contract
  balance is 0 GEN.
- On CANCELLED, every current ticket holder (including a ticket
  sitting on a resale listing) is refunded the full 10 GEN face
  price. On POSTPONED, funds stay locked and the event can be
  settled again.

## Evidence

- `EXPECTED.md` — every evidence case pre-registered before the run.
- `evidence/transactions.json` — all 30 evidence transactions
  (2 launch configurations, 4 primary sales, 5 resale steps,
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

Final ledger: 61 GEN in = 61 GEN out, contract balance 0 GEN,
escrow 0, royalties 2.1 GEN, resale volume 21 GEN.

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
  v1 has no on-chain POSTPONED case (no real postponed concert
  with dual fetchable sources was found during research). The
  branch is implemented in the contract and the frontend and is
  covered by mock tests; it activates on the first rescheduled
  launch event.
- It does not prove the venue pages will keep their current
  wording: the verdict reads the live pages at settlement time.
  If a source page is rewritten, the verdict follows the new text.
- It does not enforce that settlement happens only after the event
  date: Studionet has no clock. Both launch events already
  happened, so this does not affect v1; a future version with
  organizer-listed events would need a source-URL allowlist and a
  settlement gate.
- It does not prove ticket authenticity at a venue door: the
  on-chain ticket is a payment and settlement record, not a
  venue entry credential.

## Iteration record

- 2026-11-12: fairgate-1 deployed and verified (see EVIDENCE.md).
  Probe contract (separate deployment) verified all four anchor
  URLs are fetchable by validators and contain exactly the
  expected keywords before the product contract was written.
