# FairGate — anti-scalper concert tickets with consensus event-outcome settlement

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

- Address: [0x38b0aE26d0C6DE7F5C8418368a2dc10f4d843E5E](https://explorer-studio.genlayer.com/address/0x38b0aE26d0C6DE7F5C8418368a2dc10f4d843E5E)
- Protocol: fairgate-1.2
- Source SHA-256: `51a4059beb9e72be889b6096577581d7947ed71f903b9b2faf236a43a6c414df`
- Deploy tx: [0xb022a4db01dd729942e7e9c7ba87c304373129869dd7500732bbb6fe259382f6](https://explorer-studio.genlayer.com/tx/0xb022a4db01dd729942e7e9c7ba87c304373129869dd7500732bbb6fe259382f6)
- Network: GenLayer Stable Studionet (chain 61999)
- Byte parity: `node scripts/byte_parity.mjs` (deployed code == repo source, byte for byte)

v1.1 (fairgate-1.1, `0x10015888…`) verified clean but is superseded:
its `configure_event` was permissionless, settlement had no on-chain
date gate (the future event E3 could have been settled early), and
the verdict read keywords only, without confirming the page was
about the right event. v1.1's contract and evidence are archived in
`evidence/v1.1/`. v1 (fairgate-1) is archived in `evidence/v1/`.

## The four launch events

v1.2 ships exactly four real concerts, fixed in the contract source.
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
| Pentatonix: Christmas in the City Tour, Bridgestone Arena, Nashville | 9 December 2026, 7:00 PM | [bridgestonearena.com](https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour) | [do615.com](https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets) — Nashville independent event calendar | ON_SALE (live — settlement pending the real date) |

E4's second source is an independent news report rather than an
event listing: no independent listing with postponement wording
was fetchable (the Minneapolis listing site was unreachable and
the ticket-aggregator page returned 403 to validators). That is
disclosed in the contract and in EXPECTED.md, not hidden.

## How the verdict is decided (no LLM)

Each validator fetches both source pages and scans the raw body,
lowercased. Before any keyword counts, each page must confirm it
is the right event: the page must contain the artist token AND
the venue token for that event (oasis + wembley; metro boomin +
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
written, a probe contract had validators fetch all eight v1.2
pages live: E1a 200 / 126,071 chars, E1b 200 / 154,962 chars,
E2a 200 / 105,253 chars (cancel only), E2b 200 / 62,654 chars
(cancel only), E3a 200 / 101,205 chars, E3b 200 / 52,158 chars,
E4a 200 / 137,128 chars (postpone only), E4b 200 / 220,339 chars
(postpone only) — every page with the expected keyword signature
and its identity tokens confirmed. Bandsintown returned 403 to
validators and was dropped as a source. The same probe confirmed
the contract clock: `datetime.now(timezone.utc)` returned the
transaction datetime, matching real UTC to the minute.

Settlement date gate (on-chain, not frontend time): `settle_event`
reads the transaction datetime — GenLayer-native and deterministic
across validators — and requires today to be strictly after the
event date. An attempt on or before the event date fails with
`TOO_EARLY` and changes nothing (proven on-chain for E3 in the
evidence run). The frontend disables the settle button until the
day after the show as a second layer only.

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
  close to zero escrow; the 20 GEN contract balance is exactly
  E3's open ticket escrow (live money for a future show), not
  stranded value.
- On CANCELLED, every current ticket holder (including a ticket
  sitting on a resale listing) is refunded the 10 GEN face price.
  A resale buyer who paid 11 GEN gets 10 back and loses 1 GEN —
  the refund is the face price, not the price paid. On POSTPONED,
  funds stay locked and the event can be settled again.

## Evidence

- `EXPECTED.md` — every evidence case pre-registered before the run.
- `evidence/transactions.json` — all 42 evidence transactions
  (4 launch configurations, 6 primary sales, 7 resale steps,
  17 adversarial-scenario transactions with 15 exact error codes,
  4 settlements, 4 withdrawals) + deploy tx, all FINALIZED.
- `EVIDENCE.md` — final readback, ledger, adversarial table.
- `REVIEWER.md` — one-page reviewer entry: claim, anchors,
  contract, every transaction hash with explorer links,
  adversarial cases, what this project does not prove.
- `node scripts/verify_evidence.mjs` — re-reads every recorded
  transaction live and re-checks the final readback against
  EXPECTED.md. `python3 tests/test_fairgate_mock.py` — deterministic
  rule tests (keyword scan, identity check, verdict mapping, date
  gate, creator-only configure, cap, royalty, injection).

Final ledger (scripted run, before the browser pass): 92 GEN in =
72 GEN withdrawn + 20 GEN contract balance (E3 live escrow),
royalties 3.2 GEN, resale volume 32 GEN. Settled events (E1+E2)
close at 61 GEN in = 61 GEN out, balance 0. E4 (POSTPONED) moves
no money: 0 in, 0 out, 0 escrow.

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

Contract entry points: `configure_event`, `buy_ticket`,
`list_resale`, `cancel_resale`, `buy_resale`, `settle_event`,
`withdraw`; views: `get_event`, `get_all_events`, `get_ticket`,
`get_all_tickets`, `get_credit`, `get_counts`, `get_protocol`,
`get_creator`.

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
- It does not settle E3 yet: E3 (9 Dec 2026) is deliberately left
  unsettled until after its real date, and an early attempt is
  refused on-chain. The organizer key is retained offline by the
  project operator (never committed) so the organizer credit can be
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
  EVIDENCE.md). Creator-only configure, on-chain settlement
  date gate (transaction datetime), identity-anchored verdict,
  and a fourth launch event E4 (KATSEYE, Target Center,
  7 Nov 2026, POSTPONED) proving the postponed branch on-chain.
  All eight source URLs and the contract clock were
  probe-verified before deploy (probe contract 0x6C7Fa707…).
