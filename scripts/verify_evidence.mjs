// FairGate: independent verification. Re-reads EVERY transaction in
// evidence/transactions.json live from Studionet and re-checks the
// final readback against EXPECTED.md. Exact comparisons only: no
// substring matching, and a MAJORITY_DISAGREE is never counted as PASS.
// Usage: node scripts/verify_evidence.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';

const RPC_URL = 'https://studio.genlayer.com/api';
const CHAIN_ID = 61999;
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reader = createClient({chain: studionet});
const deployment = JSON.parse(fs.readFileSync(path.join(REPO, 'evidence', 'deployment.json'), 'utf8'));
const txs = JSON.parse(fs.readFileSync(path.join(REPO, 'evidence', 'transactions.json'), 'utf8'));
const ADDRESS = deployment.contract_address;
const sha = (s) => createHash('sha256').update(s).digest('hex');

let pass = 0;
let fail = 0;
const failures = [];
function ok(name, cond, extra = '') {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; failures.push(name); console.log('FAIL', name, extra); }
}
function leaderReceipt(tx) {
  let r = tx?.consensus_data?.leader_receipt;
  if (Array.isArray(r)) r = r.find((x) => x.mode === 'leader');
  return r || null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. Byte parity: deployed code == repo source, byte for byte.
const source = fs.readFileSync(path.join(REPO, 'contracts', 'fairgate.py'), 'utf8');
const onChain = await reader.getContractCode(ADDRESS);
ok('byte parity (deployed code == repo source)', onChain === source);
ok('source sha matches deployment.json', sha(source) === deployment.source_sha256);
ok('deploy tx recorded', typeof txs.deploy_tx === 'string' && txs.deploy_tx.startsWith('0x'));

// 2. Every recorded transaction, re-read live.
const EXPECTED_ERROR = {
  'neg1-unknown-event': 'EVENT_NOT_FOUND',
  'neg2-wrong-value': 'VALUE_MUST_EQUAL_PRICE',
  'neg3-stranger-list': 'NOT_TICKET_OWNER',
  'neg4-over-cap': 'PRICE_CAP',
  'neg5-not-listed': 'TICKET_NOT_LISTED',
  'neg6-self-buy': 'SELF_PURCHASE',
  'neg7-stranger-withdraw': 'NO_CREDIT',
  'neg8-double-withdraw': 'NO_CREDIT',
  'neg9-double-settle': 'EVENT_ALREADY_SETTLED',
  'neg10-list-refunded': 'TICKET_NOT_ACTIVE',
  'neg11-buy-held': 'EVENT_NOT_ON_SALE',
};
const EXPECTED_VERDICT = {
  's1-settle-e1': 'EVENT_HELD',
  's2-settle-e2': 'CANCELLED',
};
for (const rec of txs.transactions) {
  await sleep(200);
  let tx;
  try {
    tx = await reader.waitForTransactionReceipt({hash: rec.hash, status: 'FINALIZED', interval: 5000, retries: 6, fullTransaction: true});
  } catch (e) {
    ok(`tx ${rec.label} re-read FINALIZED`, false, String(e?.message || e));
    continue;
  }
  const finalized = [7, 'FINALIZED'].includes(tx.status);
  const agreed = [6, 'MAJORITY_AGREE'].includes(tx.result);
  const leader = leaderReceipt(tx);
  if (rec.result === 'ok') {
    ok(`tx ${rec.label} FINALIZED+AGREE+SUCCESS`, finalized && agreed && leader?.execution_result === 'SUCCESS',
      `status=${tx.status} result=${tx.result} leader=${leader?.execution_result}`);
    if (EXPECTED_VERDICT[rec.label]) {
      ok(`tx ${rec.label} verdict recorded as ${EXPECTED_VERDICT[rec.label]}`, rec.verdict === EXPECTED_VERDICT[rec.label], `recorded verdict=${rec.verdict}`);
    }
  } else if (rec.result === 'error-observed') {
    const payload = leader?.result?.payload || '';
    ok(`tx ${rec.label} FINALIZED+AGREE+ERROR with exact payload ${EXPECTED_ERROR[rec.label]}`,
      finalized && agreed && leader?.execution_result === 'ERROR' && payload === EXPECTED_ERROR[rec.label],
      `status=${tx.status} result=${tx.result} leader=${leader?.execution_result} payload=${payload}`);
  } else if (rec.result === 'disagreed-retry') {
    ok(`tx ${rec.label} is a recorded MAJORITY_DISAGREE retry (fail-closed, not a pass)`,
      [5, 'MAJORITY_DISAGREE'].includes(tx.result));
  } else {
    ok(`tx ${rec.label} has a known result kind`, false, rec.result);
  }
}

// 3. Final readback vs EXPECTED.md (latest-final reads).
const read = async (fn, args) => JSON.parse(await reader.readContract({address: ADDRESS, functionName: fn, args, transactionHashVariant: 'latest-final'}));
const e1 = await read('get_event', [1]);
const e2 = await read('get_event', [2]);
const e3 = await read('get_event', [3]);
ok('E1 readback: EVENT_HELD, 2 sold, escrow 0, organizer paid',
  e1.status === 'EVENT_HELD' && e1.verdict === 'EVENT_HELD' && e1.tickets_sold === 2
  && e1.escrowed_wei === 0 && e1.organizer_paid === true && e1.settle_count === 1, JSON.stringify(e1));
ok('E2 readback: CANCELLED, 2 sold, escrow 0',
  e2.status === 'CANCELLED' && e2.verdict === 'CANCELLED' && e2.tickets_sold === 2
  && e2.escrowed_wei === 0 && e2.settle_count === 1, JSON.stringify(e2));
ok('E3 readback: ON_SALE, 4 sold, escrow 40 GEN, never settled',
  e3.status === 'ON_SALE' && e3.verdict === '' && e3.tickets_sold === 4
  && e3.escrowed_wei === 40000000000000000000 && e3.organizer_paid === false && e3.settle_count === 0, JSON.stringify(e3));
ok('E1 anchors are the probe-verified URLs',
  e1.source_a_url === 'http://www.wembleystadium.com/events/2025/OASIS'
  && e1.source_b_url === 'https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/', JSON.stringify(e1));
ok('E2 anchors are the probe-verified URLs',
  e2.source_a_url === 'https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour'
  && e2.source_b_url === 'https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets', JSON.stringify(e2));
ok('E3 anchors are the probe-verified URLs',
  e3.source_a_url === 'https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour'
  && e3.source_b_url === 'https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets', JSON.stringify(e3));
const wallets = deployment.wallets;
const expectTickets = {
  1: {status: 'ACTIVE', owner: wallets.B2},
  2: {status: 'ACTIVE', owner: wallets.B1},
  3: {status: 'REFUNDED', owner: wallets.B1},
  4: {status: 'REFUNDED', owner: wallets.B2},
  5: {status: 'ACTIVE', owner: wallets.B2},
  6: {status: 'ACTIVE', owner: wallets.B2},
  // Browser write loop, pass 1 (ticket #7) and pass 2 (ticket #8).
  // Full addresses read back live from the contract; the buyer keys
  // were the browser temp accounts (see EXPECTED.md).
  7: {status: 'ACTIVE', owner: '0x55b360b6c50d740f9f9e4fd53859bf6940823c41'},
  8: {status: 'ACTIVE', owner: '0xd4bbeaca522cfd6f69be9affb2d99192bc2e4337'},
};
for (const [id, e] of Object.entries(expectTickets)) {
  const t = await read('get_ticket', [Number(id)]);
  ok(`ticket ${id} readback == EXPECTED.md (${e.status}, owner ${e.owner.slice(0, 6)}…)`,
    t.status === e.status && t.owner === e.owner, JSON.stringify(t));
}
for (const k of Object.keys(wallets)) {
  // ART is checked explicitly below: the browser resales added 2.2 GEN
  // of royalties to it, so it is no longer 0.
  if (k === 'ART') continue;
  const c = await read('get_credit', [wallets[k]]);
  ok(`credit ${k} is 0 after withdrawals`, c.credit_wei === 0, JSON.stringify(c));
}
// Browser-loop seller credits, unwithdrawn and disclosed (EXPECTED.md):
// pass-1 seller A and pass-2 seller C each hold 9.9 GEN; the artist
// holds 1.1 + 1.1 GEN royalties. Their temp keys were lost in the
// browser runs, so the credits sit on-chain, recorded — not stranded
// value from a failed payable (all failed payables sent 0 GEN).
const browserCredits = {
  'pass-1 seller A (0xc2a0…c033)': ['0xC2A07C1da2F905baF794084177A243952826c033', 9900000000000000000],
  'pass-2 seller C (0xb340…5008)': ['0xb3409F9e5B467e4f249F5D2BAF12AC4684FC5008', 9900000000000000000],
  'artist royalties (1.1 + 1.1)': [wallets.ART, 2200000000000000000],
};
for (const [label, [addr, wei]] of Object.entries(browserCredits)) {
  const c = await read('get_credit', [addr]);
  ok(`credit ${label} is ${wei / 1e18} GEN, unwithdrawn (disclosed)`, c.credit_wei === wei, JSON.stringify(c));
}
const counts = await read('get_counts', []);
ok('counts: 3 events, 8 tickets',
  counts.event_count === 3 && counts.ticket_count === 8, JSON.stringify(counts));
ok('ledger: 134 GEN in, 72 out, balance 62 GEN (= E3 escrow 40 + seller credits 9.9 + 9.9 + artist 2.2, all disclosed), escrow 40, royalties 5.4 GEN, resale volume 54 GEN',
  counts.total_received_wei === 134000000000000000000
  && counts.total_withdrawn_wei === 72000000000000000000
  && counts.contract_balance_wei === 62000000000000000000 && counts.escrowed_wei === 40000000000000000000
  && counts.total_royalties_wei === 5400000000000000000
  && counts.total_resale_volume_wei === 54000000000000000000, JSON.stringify(counts));
ok('protocol is fairgate-1.1', (await reader.readContract({address: ADDRESS, functionName: 'get_protocol', args: [], transactionHashVariant: 'latest-final'})) === 'fairgate-1.1');

console.log(`\nverify: ${pass} PASS, ${fail} FAIL, ${txs.transactions.length} txs checked`);
if (fail > 0) { console.log('failures:', failures.join(', ')); process.exit(1); }
console.log('INDEPENDENT VERIFICATION PASS');
