// FairGate: independent verification, v1.2. Re-reads EVERY transaction in
// evidence/transactions.json live from Studionet and re-checks the
// final readback against EXPECTED.md. Exact comparisons only: no
// substring matching, and a MAJORITY_DISAGREE is never counted as PASS.
// NOTE: this checks the scripted evidence state. After the browser
// write loop adds tickets, the ticket/ledger expectations below must
// be updated to the post-browser state (as in v1.1) before re-running.
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
  'neg0-not-creator': 'NOT_CREATOR',
  'neg14-bad-address': 'BAD_ADDRESS',
  'neg12-buy-unconfigured': 'EVENT_NOT_CONFIGURED',
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
  'neg13-early-settle-e3': 'TOO_EARLY',
};
const EXPECTED_VERDICT = {
  's1-settle-e1': 'EVENT_HELD',
  's2-settle-e2': 'CANCELLED',
  's3-settle-e4': 'POSTPONED',
  's3b-resettle-e4': 'POSTPONED',
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
const e4 = await read('get_event', [4]);
ok('E1 readback: EVENT_HELD, 2 sold, escrow 0, organizer paid',
  e1.status === 'EVENT_HELD' && e1.verdict === 'EVENT_HELD' && e1.tickets_sold === 2
  && e1.escrowed_wei === 0 && e1.organizer_paid === true && e1.settle_count === 1, JSON.stringify(e1));
ok('E2 readback: CANCELLED, 2 sold, escrow 0',
  e2.status === 'CANCELLED' && e2.verdict === 'CANCELLED' && e2.tickets_sold === 2
  && e2.escrowed_wei === 0 && e2.settle_count === 1, JSON.stringify(e2));
ok('E3 readback: ON_SALE, 2 sold, escrow 20 GEN, never settled',
  e3.status === 'ON_SALE' && e3.verdict === '' && e3.tickets_sold === 2
  && e3.escrowed_wei === 20000000000000000000 && e3.organizer_paid === false && e3.settle_count === 0, JSON.stringify(e3));
ok('E4 readback: POSTPONED, 0 sold, escrow 0, settled twice',
  e4.status === 'POSTPONED' && e4.verdict === 'POSTPONED' && e4.tickets_sold === 0
  && e4.escrowed_wei === 0 && e4.organizer_paid === false && e4.settle_count === 2, JSON.stringify(e4));
ok('E1 anchors are the probe-verified URLs',
  e1.source_a_url === 'http://www.wembleystadium.com/events/2025/OASIS'
  && e1.source_b_url === 'https://wembleypark.com/things-to-do/ultimate-guide-to-oasis-at-wembley-stadium/', JSON.stringify(e1));
ok('E2 anchors are the probe-verified URLs',
  e2.source_a_url === 'https://www.bridgestonearena.com/events/detail/future-metro-boomin-we-trust-you-tour'
  && e2.source_b_url === 'https://do615.com/events/2024/8/6/future-metro-boomin-we-trust-you-tour-tickets', JSON.stringify(e2));
ok('E3 anchors are the probe-verified URLs',
  e3.source_a_url === 'https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour'
  && e3.source_b_url === 'https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets', JSON.stringify(e3));
ok('E4 anchors are the probe-verified URLs',
  e4.source_a_url === 'https://www.targetcenter.com/events/detail/katseye'
  && e4.source_b_url === 'https://www.musictimes.com/articles/113245/20261109/katseye-postpone-chicago-minneapolis-shows-megan-recovers-concussion.htm', JSON.stringify(e4));
ok('E1 identity tokens are oasis + wembley', e1.id_a === 'oasis' && e1.id_b === 'wembley', JSON.stringify(e1));
ok('E2 identity tokens are metro boomin + bridgestone', e2.id_a === 'metro boomin' && e2.id_b === 'bridgestone', JSON.stringify(e2));
ok('E3 identity tokens are pentatonix + bridgestone', e3.id_a === 'pentatonix' && e3.id_b === 'bridgestone', JSON.stringify(e3));
ok('E4 identity tokens are katseye + target center', e4.id_a === 'katseye' && e4.id_b === 'target center', JSON.stringify(e4));
ok('creator is the deployer P1', (await reader.readContract({address: ADDRESS, functionName: 'get_creator', args: [], transactionHashVariant: 'latest-final'})) === deployment.wallets.P1, JSON.stringify(deployment.wallets.P1));
const wallets = deployment.wallets;
const expectTickets = {
  1: {status: 'ACTIVE', owner: wallets.B2},
  2: {status: 'ACTIVE', owner: wallets.B1},
  3: {status: 'REFUNDED', owner: wallets.B1},
  4: {status: 'REFUNDED', owner: wallets.B2},
  5: {status: 'ACTIVE', owner: wallets.B2},
  6: {status: 'ACTIVE', owner: wallets.B2},
};
for (const [id, e] of Object.entries(expectTickets)) {
  const t = await read('get_ticket', [Number(id)]);
  ok(`ticket ${id} readback == EXPECTED.md (${e.status}, owner ${e.owner.slice(0, 6)}…)`,
    t.status === e.status && t.owner === e.owner, JSON.stringify(t));
}
for (const k of Object.keys(wallets)) {
  const c = await read('get_credit', [wallets[k]]);
  ok(`credit ${k} is 0 after withdrawals`, c.credit_wei === 0, JSON.stringify(c));
}
const counts = await read('get_counts', []);
ok('counts: 4 events, 6 tickets',
  counts.event_count === 4 && counts.ticket_count === 6, JSON.stringify(counts));
ok('ledger: 92 GEN in, 72 out, balance 20 GEN (= E3 live escrow, all disclosed), escrow 20, royalties 3.2 GEN, resale volume 32 GEN',
  counts.total_received_wei === 92000000000000000000
  && counts.total_withdrawn_wei === 72000000000000000000
  && counts.contract_balance_wei === 20000000000000000000 && counts.escrowed_wei === 20000000000000000000
  && counts.total_royalties_wei === 3200000000000000000
  && counts.total_resale_volume_wei === 32000000000000000000, JSON.stringify(counts));
ok('protocol is fairgate-1.2', (await reader.readContract({address: ADDRESS, functionName: 'get_protocol', args: [], transactionHashVariant: 'latest-final'})) === 'fairgate-1.2');

console.log(`\nverify: ${pass} PASS, ${fail} FAIL, ${txs.transactions.length} txs checked`);
if (fail > 0) { console.log('failures:', failures.join(', ')); process.exit(1); }
console.log('INDEPENDENT VERIFICATION PASS');
