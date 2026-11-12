// FairGate: independent verification, v1.3. Re-reads EVERY transaction in
// evidence/transactions.json AND docs/browser-transactions.json (when
// the browser loop has run) live from Studionet and re-checks the
// final readback against EXPECTED.md. Exact comparisons only: no
// substring matching, and a MAJORITY_DISAGREE is never counted as PASS.
// The browser loop runs on the live site after the scripted run; the
// aggregate checks below are phase-aware: with no browser txs they
// expect the scripted state (7 tickets, 102 in / 72 out / 30 balance),
// with browser txs they expect the post-browser state (8 tickets,
// 123 in / 83 out / 40 balance). Everything else (events, tickets
// 1-7, credits 0, anchors, identity tokens, protocol) is checked
// identically in both phases.
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
const historical = process.argv.includes('--historical-v13');
const evidenceDir = historical ? 'evidence/v1.3' : 'evidence';
const deployment = JSON.parse(fs.readFileSync(path.join(REPO, evidenceDir, 'deployment.json'), 'utf8'));
const txs = JSON.parse(fs.readFileSync(path.join(REPO, evidenceDir, 'transactions.json'), 'utf8'));
let browser = null;
try {
  browser = JSON.parse(fs.readFileSync(path.join(REPO, historical ? evidenceDir : 'docs', 'browser-transactions.json'), 'utf8'));
} catch { browser = null; }
const browserTxs = Array.isArray(browser?.transactions) ? browser.transactions : [];
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
const source = fs.readFileSync(path.join(REPO, historical ? evidenceDir : 'contracts', 'fairgate.py'), 'utf8');
if (!historical && sha(source) !== deployment.source_sha256) throw new Error('SOURCE_NOT_DEPLOYED: current V1.4 source requires a fresh deployment and evidence. Use --historical-v13 only to audit the archived V1.3 deployment.');
if (historical) console.log('HISTORICAL V1.3 ONLY: these receipts do not verify V1.4 release safety.');
const onChain = await reader.getContractCode(ADDRESS);
ok('byte parity (deployed code == repo source)', onChain === source);
ok('source sha matches deployment.json', sha(source) === deployment.source_sha256);
ok('deploy tx recorded', typeof txs.deploy_tx === 'string' && txs.deploy_tx.startsWith('0x'));
ok('evidence file names the deployed contract', txs.contract_address === ADDRESS, String(txs.contract_address));

// 2. Every recorded transaction, re-read live (scripted + browser).
const EXPECTED_ERROR = {
  'neg0-not-creator': 'NOT_CREATOR',
  'neg14-bad-address': 'BAD_ADDRESS',
  'neg15-bad-settle-after': 'BAD_SETTLE_AFTER_TS',
  'neg16-bad-tz-offset': 'BAD_TZ_OFFSET',
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
  'neg17-settle-after-rsch': 'TOO_EARLY',
  'neg18-rsch-stranger': 'NOT_CREATOR',
  'neg19-rsch-onsale': 'NOT_POSTPONED',
  'neg20-rsch-earlier': 'DATE_NOT_LATER',
  'neg21-rsch-settled-e1': 'NOT_POSTPONED',
  'neg22-rsch-settled-e2': 'NOT_POSTPONED',
  'neg23-rsch-bad-settle': 'BAD_SETTLE_AFTER_TS',
};
const EXPECTED_VERDICT = {
  's1-settle-e1': 'EVENT_HELD',
  's2-settle-e2': 'CANCELLED',
  's3-settle-e4': 'POSTPONED',
};
async function checkTxRecord(rec, kind) {
  await sleep(200);
  let tx;
  try {
    tx = await reader.waitForTransactionReceipt({hash: rec.hash, status: 'FINALIZED', interval: 5000, retries: 6, fullTransaction: true});
  } catch (e) {
    ok(`tx ${rec.label} (${kind}) re-read FINALIZED`, false, String(e?.message || e));
    return;
  }
  const finalized = [7, 'FINALIZED'].includes(tx.status);
  const agreed = [6, 'MAJORITY_AGREE'].includes(tx.result);
  const leader = leaderReceipt(tx);
  if (rec.result === 'ok') {
    ok(`tx ${rec.label} (${kind}) FINALIZED+AGREE+SUCCESS`, finalized && agreed && leader?.execution_result === 'SUCCESS',
      `status=${tx.status} result=${tx.result} leader=${leader?.execution_result}`);
    if (EXPECTED_VERDICT[rec.label]) {
      ok(`tx ${rec.label} verdict recorded as ${EXPECTED_VERDICT[rec.label]}`, rec.verdict === EXPECTED_VERDICT[rec.label], `recorded verdict=${rec.verdict}`);
    }
  } else if (rec.result === 'error-observed') {
    const payload = leader?.result?.payload || '';
    ok(`tx ${rec.label} (${kind}) FINALIZED+AGREE+ERROR with exact payload ${EXPECTED_ERROR[rec.label]}`,
      finalized && agreed && leader?.execution_result === 'ERROR' && payload === EXPECTED_ERROR[rec.label],
      `status=${tx.status} result=${tx.result} leader=${leader?.execution_result} payload=${payload}`);
  } else if (rec.result === 'disagreed-retry') {
    ok(`tx ${rec.label} (${kind}) is a recorded MAJORITY_DISAGREE retry (fail-closed, not a pass)`,
      [5, 'MAJORITY_DISAGREE'].includes(tx.result));
  } else {
    ok(`tx ${rec.label} (${kind}) has a known result kind`, false, rec.result);
  }
}
for (const rec of txs.transactions) await checkTxRecord(rec, 'scripted');
if (browserTxs.length === 0) {
  console.log('\nbrowser write loop: not yet run — scripted checks above are the complete result for now');
} else {
  console.log(`\nbrowser write loop: ${browserTxs.length} txs recorded, verifying live`);
  ok('browser file names the same contract', browser.contract_address === ADDRESS, String(browser.contract_address));
  for (const rec of browserTxs) await checkTxRecord(rec, 'browser');
}

// 3. Final readback vs EXPECTED.md (latest-final reads).
const read = async (fn, args) => JSON.parse(await reader.readContract({address: ADDRESS, functionName: fn, args, transactionHashVariant: 'latest-final'}));
const e1 = await read('get_event', [1]);
const e2 = await read('get_event', [2]);
const e3 = await read('get_event', [3]);
const e4 = await read('get_event', [4]);
ok('E1 readback: EVENT_HELD, 2 sold, escrow 0, organizer paid, timestamps stored',
  e1.status === 'EVENT_HELD' && e1.verdict === 'EVENT_HELD' && e1.tickets_sold === 2
  && e1.escrowed_wei === 0 && e1.organizer_paid === true && e1.settle_count === 1
  && e1.event_start_ts === 1753466400 && e1.settle_after_ts === 1753484400 && e1.tz_offset_min === 60, JSON.stringify(e1));
ok('E2 readback: CANCELLED, 2 sold, escrow 0, timestamps stored',
  e2.status === 'CANCELLED' && e2.verdict === 'CANCELLED' && e2.tickets_sold === 2
  && e2.escrowed_wei === 0 && e2.settle_count === 1
  && e2.event_start_ts === 1722992400 && e2.settle_after_ts === 1723006800 && e2.tz_offset_min === -300, JSON.stringify(e2));
ok('E4 readback: POSTPONED, 1 sold, escrow 10 GEN, rescheduled to 2027-02-20, settle_count 1',
  e4.status === 'POSTPONED' && e4.verdict === 'POSTPONED' && e4.tickets_sold === 1
  && e4.escrowed_wei === 10000000000000000000 && e4.organizer_paid === false && e4.settle_count === 1
  && e4.event_start_ts === 1803175200 && e4.settle_after_ts === 1803189600 && e4.tz_offset_min === -360
  && e4.date_iso === '2027-02-20', JSON.stringify(e4));
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
ok('E3 timestamps: start 2026-12-09 19:00 CST, settle_after 2026-12-10T06:00:00Z',
  e3.event_start_ts === 1796864400 && e3.settle_after_ts === 1796882400 && e3.tz_offset_min === -360, JSON.stringify(e3));
ok('creator is the deployer P1', (await reader.readContract({address: ADDRESS, functionName: 'get_creator', args: [], transactionHashVariant: 'latest-final'})) === deployment.wallets.P1, JSON.stringify(deployment.wallets.P1));
const wallets = deployment.wallets;
const expectTickets = {
  1: {status: 'ACTIVE', owner: wallets.B2},
  2: {status: 'ACTIVE', owner: wallets.B1},
  3: {status: 'REFUNDED', owner: wallets.B1},
  4: {status: 'REFUNDED', owner: wallets.B2},
  5: {status: 'ACTIVE', owner: wallets.B2},
  6: {status: 'ACTIVE', owner: wallets.B2},
  7: {status: 'ACTIVE', owner: wallets.B1},
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
if (browserTxs.length === 0) {
  ok('E3 readback (scripted): ON_SALE, 2 sold, escrow 20 GEN, never settled',
    e3.status === 'ON_SALE' && e3.verdict === '' && e3.tickets_sold === 2
    && e3.escrowed_wei === 20000000000000000000 && e3.organizer_paid === false && e3.settle_count === 0, JSON.stringify(e3));
  ok('counts (scripted): 4 events, 7 tickets',
    counts.event_count === 4 && counts.ticket_count === 7, JSON.stringify(counts));
  ok('ledger (scripted): 102 GEN in, 72 out, balance 30 GEN (= E3 20 + E4 10 escrow), escrow 30, royalties 3.2 GEN, resale volume 32 GEN',
    counts.total_received_wei === 102000000000000000000
    && counts.total_withdrawn_wei === 72000000000000000000
    && counts.contract_balance_wei === 30000000000000000000 && counts.escrowed_wei === 30000000000000000000
    && counts.total_royalties_wei === 3200000000000000000
    && counts.total_resale_volume_wei === 32000000000000000000, JSON.stringify(counts));
} else {
  ok('E3 readback (post-browser): ON_SALE, 3 sold, escrow 30 GEN, never settled',
    e3.status === 'ON_SALE' && e3.verdict === '' && e3.tickets_sold === 3
    && e3.escrowed_wei === 30000000000000000000 && e3.organizer_paid === false && e3.settle_count === 0, JSON.stringify(e3));
  const t8 = await read('get_ticket', [8]);
  ok('ticket 8 (browser buy) readback: ACTIVE, owned by the browser buyer',
    t8.status === 'ACTIVE' && typeof t8.owner === 'string' && t8.owner.startsWith('0x'), JSON.stringify(t8));
  ok('counts (post-browser): 4 events, 8 tickets',
    counts.event_count === 4 && counts.ticket_count === 8, JSON.stringify(counts));
  ok('ledger (post-browser): 123 GEN in, 83 out, balance 40 GEN (= E3 30 + E4 10 escrow), escrow 40, royalties 4.3 GEN, resale volume 43 GEN',
    counts.total_received_wei === 123000000000000000000
    && counts.total_withdrawn_wei === 83000000000000000000
    && counts.contract_balance_wei === 40000000000000000000 && counts.escrowed_wei === 40000000000000000000
    && counts.total_royalties_wei === 4300000000000000000
    && counts.total_resale_volume_wei === 43000000000000000000, JSON.stringify(counts));
}
ok('protocol is fairgate-1.3', (await reader.readContract({address: ADDRESS, functionName: 'get_protocol', args: [], transactionHashVariant: 'latest-final'})) === 'fairgate-1.3');

console.log(`\nverify: ${pass} PASS, ${fail} FAIL, ${txs.transactions.length} scripted txs + ${browserTxs.length} browser txs checked`);
if (fail > 0) { console.log('failures:', failures.join(', ')); process.exit(1); }
console.log('INDEPENDENT VERIFICATION PASS');
