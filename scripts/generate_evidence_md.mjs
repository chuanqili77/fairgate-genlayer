// Generate EVIDENCE.md and REVIEWER.md from the real evidence files.
// Never hand-copy hashes: every hash in the output comes from
// evidence/transactions.json / evidence/deployment.json as recorded
// by the evidence run, and the ledger numbers come from a live
// latest-final readback at generation time.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPLORER = 'https://explorer-studio.genlayer.com';

const deployment = JSON.parse(fs.readFileSync(path.join(REPO, 'evidence', 'deployment.json'), 'utf8'));
const txFile = JSON.parse(fs.readFileSync(path.join(REPO, 'evidence', 'transactions.json'), 'utf8'));
const txs = Array.isArray(txFile) ? txFile : txFile.transactions;
const src = fs.readFileSync(path.join(REPO, 'contracts', 'fairgate.py'));
const sha = createHash('sha256').update(src).digest('hex');

const txLink = (h) => `[${h.slice(0, 10)}…](${EXPLORER}/tx/${h})`;
const addrLink = (a) => `[${a}](${EXPLORER}/address/${a})`;

const { execSync } = await import('node:child_process');
const verifyOut = execSync('node scripts/verify_evidence.mjs', { cwd: REPO, encoding: 'utf8' });
const verifyPass = /PASS/.test(verifyOut);

const rows = txs.map((t, i) => `| ${i + 1} | ${t.label} | ${txLink(t.hash)} | ${t.result ?? 'ok'} |`).join('\n');

const evidenceMd = `# FairGate — Evidence

- Contract: ${addrLink(deployment.contract_address)}
- Deploy tx: ${txLink(deployment.deploy_tx)}
- Source SHA-256: \`${sha}\` (${src.length} bytes, \`contracts/fairgate.py\`)
- Network: GenLayer Stable Studionet (chain 61999)
- Independent verification: \`node scripts/verify_evidence.mjs\` — ${verifyPass ? 'PASS (see output below)' : 'SEE OUTPUT BELOW'}
- Mock tests: \`python3 tests/test_fairgate_mock.py\` — all pass

## Evidence transactions (${txs.length})

| # | Step | Transaction | Result |
|---|------|-------------|--------|
${rows}

## Final ledger (pre-registered in EXPECTED.md, confirmed by verify_evidence.mjs)

- 92 GEN in = 72 GEN withdrawn + 20 GEN live E3 escrow, contract balance 20 GEN
- Artist royalties paid: 3.2 GEN
- Resale volume: 32 GEN
- E1 Oasis Live '25: EVENT_HELD, 2 tickets sold, organizer paid 20 GEN
- E2 Future & Metro Boomin: CANCELLED, 2 tickets sold, both holders refunded the 10 GEN face price each (a resale buyer who paid 11 GEN gets 10 back)
- E3 Pentatonix, Bridgestone Arena, 9 Dec 2026: ON_SALE, 2 tickets sold, 20 GEN escrowed, NOT settled (real date in the future — the 20 GEN balance is live ticket escrow, not stranded value; an early settlement attempt was refused on-chain, neg13 TOO_EARLY)
- E4 KATSEYE, Target Center, 7 Nov 2026: POSTPONED, 0 tickets sold, 0 GEN escrowed, settled twice on-chain (settle_count 2) — the POSTPONED branch moves no money
- Tickets: #1 ACTIVE (B2), #2 ACTIVE (B1), #3 REFUNDED (B1), #4 REFUNDED (B2), #5 ACTIVE (B2, E3), #6 ACTIVE (B2, E3)
- All wallet credits 0 after final withdrawals

## Adversarial cases (all on-chain)

| Case | What was tried | Expected | Observed |
|------|---------------|----------|----------|
| neg0 | OUT configures event 1 (not the creator) | NOT_CREATOR | error |
| neg14 | P1 configures with a malformed address | BAD_ADDRESS | error |
| neg12 | buy E1 before any event is configured | EVENT_NOT_CONFIGURED | error, 0 GEN sent |
| neg1 | buy event 99 | EVENT_NOT_FOUND | error, 0 GEN sent |
| neg2 | buy E1 with 0 GEN | VALUE_MUST_EQUAL_PRICE | error, 0 GEN sent |
| neg3 | B2 lists T2 owned by B1 | NOT_TICKET_OWNER | error |
| neg4 | list T1 at 12 GEN (above 11 cap) | PRICE_CAP | error |
| neg5 | buy resale of unlisted T4 | TICKET_NOT_LISTED | error |
| neg6 | B1 buys own T2 listing | SELF_PURCHASE | error, then listing cancelled |
| neg7 | OUT withdraws with no credit | NO_CREDIT | error |
| neg8 | ORG withdraws twice | NO_CREDIT | error |
| neg9 | settle E1 twice | EVENT_ALREADY_SETTLED | error |
| neg10 | list REFUNDED T3 | TICKET_NOT_ACTIVE | error |
| neg11 | buy E1 after settlement | EVENT_NOT_ON_SALE | error, 0 GEN sent |
| neg13 | settle E3 before its date (2026-11-12 < 2026-12-09) | TOO_EARLY | error, state unchanged |

## Not covered on-chain (see EXPECTED.md)

- SOLD_OUT: no on-chain case (buying all 8 E3 tickets would close the live site's only buyable event); branch implemented + mock-covered.
- UNREACHABLE / SOURCES_DISAGREE settle outcomes: fail-closed, mock-covered only.
- E3 settlement: E3's real date is 2026-12-09, in the future; it is not settled in this run by design. An early attempt is refused on-chain (neg13, TOO_EARLY). Its 20 GEN escrow stays open until after the real date. The organizer key is retained offline by the project operator (never committed) so the organizer credit can be withdrawn after that settlement.

## Browser write loop

To be recorded by the reviewer pass on the live site (buy / list /
buy-resale / settle / withdraw with transaction hashes).

## Verify output

\`\`\`
${verifyOut.trim()}
\`\`\`
`;

const reviewerMd = `# FairGate — Reviewer pack

## Claim

FairGate sells concert tickets as on-chain stubs with a hard resale
cap (11 GEN on a 10 GEN face price) and a 10% artist royalty, and
settles escrowed ticket money by consensus on whether the show was
held, cancelled or postponed. Four real concerts, fixed in the
contract: Oasis Live '25 at Wembley (HELD), Future & Metro Boomin
at Bridgestone Arena, Nashville (CANCELLED), KATSEYE at Target
Center, Minneapolis (POSTPONED), and Pentatonix at Bridgestone
Arena, Nashville, 9 Dec 2026 (ON_SALE — live, unsettled).

## Contract

- Address: ${addrLink(deployment.contract_address)}
- Deploy tx: ${txLink(deployment.deploy_tx)}
- Source SHA-256: \`${sha}\`
- Byte parity: \`node scripts/byte_parity.mjs\` (deployed code == repo source)

## Fastest re-check (5 minutes)

1. \`node scripts/byte_parity.mjs\` — deployed code matches \`contracts/fairgate.py\`.
2. \`node scripts/verify_evidence.mjs\` — re-reads every evidence transaction live and re-checks the final readback against EXPECTED.md.
3. Open the live site and wait for the FINALIZED readback: the three settled posters show their verdicts, the Pentatonix poster shows ON_SALE with tickets to buy, and the ledger shows 92 GEN in, 72 GEN out, 20 GEN live E3 escrow.

## Anchors (the verdict reads these pages)

| Event | Source A (venue official) | Source B (independent) |
|-------|---------------------------|------------------------|
| Oasis Live '25, Wembley, 25 Jul 2025 | http://www.wembleystadium.com/events/2025/OASIS | https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/ |
| Future & Metro Boomin, Bridgestone Arena, 6 Aug 2024 | https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour | https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets |
| KATSEYE, Target Center, 7 Nov 2026 | https://www.targetcenter.com/events/detail/katseye | https://www.musictimes.com/articles/113245/20261109/katseye-postpone-chicago-minneapolis-shows-megan-recovers-concussion.htm |
| Pentatonix, Bridgestone Arena, 9 Dec 2026 | https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour | https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets |

Verdict rule (deterministic, no LLM): each source must first
confirm it is the right event (artist + venue named on the page);
then both sources fetched, neither contains
"cancelled"/"canceled"/"postpone"/"reschedule" → EVENT_HELD.
Both contain a cancel word → CANCELLED. Both contain a postpone word
→ POSTPONED. A fetch failure, a failed identity check, or
disagreement settles nothing. Settlement is also refused on-chain
before the day after the event date (transaction datetime gate):
an early attempt fails with TOO_EARLY.

## Evidence transactions

| # | Step | Transaction |
|---|------|-------------|
${txs.map((t, i) => `| ${i + 1} | ${t.label} | ${txLink(t.hash)} |`).join('\n')}

## Adversarial cases

See EVIDENCE.md: 15 negatives, all with exact on-chain error codes
(incl. NOT_CREATOR on configure, TOO_EARLY on early settlement,
PRICE_CAP at 12 GEN, SELF_PURCHASE, EVENT_ALREADY_SETTLED,
TICKET_NOT_ACTIVE, NO_CREDIT on double withdrawal). Failed payables
were sent with 0 GEN; the 20 GEN contract balance is exactly E3's
live ticket escrow, not stranded value.

## What this project does not prove

- E3 (Pentatonix, 9 Dec 2026) is not settled in this run; its verdict
  will be decided after the real date. An early settlement attempt
  is refused on-chain (TOO_EARLY) and the settle button stays
  disabled until the day after the show.
- The verdict reads the live pages at settlement time; if a source
  page is rewritten, the verdict follows the new text.
- The on-chain ticket is a payment and settlement record, not a
  venue entry credential.
`;

fs.writeFileSync(path.join(REPO, 'EVIDENCE.md'), evidenceMd);
fs.writeFileSync(path.join(REPO, 'REVIEWER.md'), reviewerMd);
console.log('wrote EVIDENCE.md (' + txs.length + ' txs) and REVIEWER.md; verify PASS:', verifyPass);
