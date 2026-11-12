// FairGate: full evidence run on Stable Studionet (61999).
// Pre-registered expectations: EXPECTED.md (written before this run).
// 3 config + 6 primary sales + 7 resale + 8 negatives + 2 settlements
// + 4 post-settlement negatives + 5 withdrawals = 35 txs + deploy.
// E3 (Pentatonix, 2026-12-09) is deliberately NOT settled: its real
// date is in the future; it stays ON_SALE with 6 of 8 tickets unsold
// so the live site has a real usable flow. Its 20 GEN escrow stays
// open by design (see EXPECTED.md ledger split).
// Resumable via the checkpoint file. Temp accounts live ONLY in the
// checkpoint file (workspace, NOT in the repo, mode 0600).
// Negative checks compare the exact leader-receipt error payload
// (result.payload), never a substring of the whole receipt, and
// verify the full on-chain state is unchanged before/after.
// Settlement retries on MAJORITY_DISAGREE: a disagreement changes
// nothing and settlement can be retried.
// Usage: node scripts/run_evidence.mjs [--checkpoint <path>]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createClient, createAccount} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';

const RPC_URL = 'https://studio.genlayer.com/api';
const CHAIN_ID = 61999;
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const CHECKPOINT = opt('--checkpoint', path.resolve(REPO, '..', '.fairgate-checkpoint.json'));
const TX_PATH = path.join(REPO, 'evidence', 'transactions.json');
const GEN = 1000000000000000000n;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function loadCheckpoint() {
  return JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8'));
}
function saveCheckpoint(cp) {
  fs.writeFileSync(CHECKPOINT, JSON.stringify(cp, null, 2), {mode: 0o600});
  fs.chmodSync(CHECKPOINT, 0o600);
}
function leaderReceipt(tx) {
  let r = tx?.consensus_data?.leader_receipt;
  if (Array.isArray(r)) r = r.find((x) => x.mode === 'leader');
  return r || null;
}
function leaderExec(tx) { return leaderReceipt(tx)?.execution_result; }
function leaderError(tx) { return leaderReceipt(tx)?.result?.payload || ''; }
function good(tx) {
  return [7, 'FINALIZED'].includes(tx.status)
    && [6, 'MAJORITY_AGREE'].includes(tx.result)
    && leaderExec(tx) === 'SUCCESS';
}
function errorObserved(tx, code) {
  return [7, 'FINALIZED'].includes(tx.status)
    && [6, 'MAJORITY_AGREE'].includes(tx.result)
    && leaderExec(tx) === 'ERROR'
    && leaderError(tx) === code;
}
async function collect(client, hash, label) {
  console.log(label, hash);
  for (let i = 0; i < 3; i++) {
    try {
      const tx = await client.waitForTransactionReceipt({hash, status: 'FINALIZED', interval: 5000, retries: 12, fullTransaction: true});
      console.log(label, 'status=', tx.status, 'result=', tx.result, 'leader=', leaderExec(tx), 'leader_error=', leaderError(tx));
      return tx;
    } catch (e) {
      console.log('tracking', label, 'attempt', i, e.shortMessage || e.message);
      await sleep(5000);
    }
  }
  throw new Error('Timeout waiting for FINALIZED: ' + label + ' ' + hash);
}

const cp = loadCheckpoint();
const ADDRESS = cp.contract_address;
if (!ADDRESS) throw new Error('no contract_address in checkpoint; deploy first');
const wallets = cp.wallets;
const accounts = {};
for (const k of Object.keys(wallets)) accounts[k] = createAccount(wallets[k]);
const clients = {};
for (const k of Object.keys(accounts)) clients[k] = createClient({chain: studionet, account: accounts[k]});
const reader = createClient({chain: studionet});
console.log('contract:', ADDRESS);
for (const k of Object.keys(accounts)) console.log(k, ':', accounts[k].address);

const ev = cp.evidence || (cp.evidence = {done: {}, tickets: {}});
const done = ev.done;
const records = [];
const NEG_ERRORS = {
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
const SETTLE_INFO = {
  's1-settle-e1': {verdict: 'EVENT_HELD', caller: 'OUT'},
  's2-settle-e2': {verdict: 'CANCELLED', caller: 'OUT'},
};
const LABEL_ORDER = ['cfg-e1', 'cfg-e2', 'cfg-e3',
  't1-buy', 't2-buy', 't3-buy', 't4-buy', 't5-buy', 't6-buy',
  'r1-list', 'r1-buy', 'r2-list', 'r2-buy', 'r3-list', 'r4-list', 'r4-buy',
  'neg3-stranger-list', 'neg4-over-cap', 'neg6-list', 'neg6-self-buy',
  'neg6-cancel', 'neg5-not-listed', 'neg2-wrong-value', 'neg1-unknown-event',
  's1-settle-e1', 's2-settle-e2',
  'neg9-double-settle', 'neg11-buy-held', 'neg10-list-refunded',
  'neg7-stranger-withdraw',
  'w-org', 'w-art', 'w-b1', 'w-b2', 'neg8-double-withdraw'];
for (const label of LABEL_ORDER) {
  const hash = done[label];
  if (!hash) continue;
  if (label.startsWith('neg')) records.push({label, hash, result: 'error-observed', expected_error: NEG_ERRORS[label]});
  else if (/-attempt-\d+$/.test(label)) records.push({label, hash, result: 'disagreed-retry'});
  else if (SETTLE_INFO[label]) records.push({label, hash, result: 'ok', ...SETTLE_INFO[label]});
  else records.push({label, hash, result: 'ok'});
}
for (const label of Object.keys(done).sort()) {
  if (LABEL_ORDER.includes(label)) continue;
  const hash = done[label];
  if (label.startsWith('neg')) records.push({label, hash, result: 'error-observed', expected_error: NEG_ERRORS[label]});
  else if (/-attempt-\d+$/.test(label)) records.push({label, hash, result: 'disagreed-retry'});
  else records.push({label, hash, result: 'ok'});
}
if (records.length > 0) console.log('resumed:', records.length, 'txs already recorded from the checkpoint');
function record(label, hash, result, extra = {}) {
  records.push({label, hash, result, ...extra});
  fs.writeFileSync(TX_PATH, JSON.stringify({network: 'Stable Studionet', chain_id: CHAIN_ID, contract_address: ADDRESS, deploy_tx: cp.deploy_tx, complete: false, transactions: records}, null, 2));
  done[label] = hash;
  saveCheckpoint(cp);
}
async function readEvent(id) {
  return JSON.parse(await reader.readContract({address: ADDRESS, functionName: 'get_event', args: [id], transactionHashVariant: 'latest-final'}));
}
async function readTicket(id) {
  return JSON.parse(await reader.readContract({address: ADDRESS, functionName: 'get_ticket', args: [id], transactionHashVariant: 'latest-final'}));
}
async function readCredit(addr) {
  return JSON.parse(await reader.readContract({address: ADDRESS, functionName: 'get_credit', args: [addr], transactionHashVariant: 'latest-final'}));
}
async function readCounts() {
  return JSON.parse(await reader.readContract({address: ADDRESS, functionName: 'get_counts', args: [], transactionHashVariant: 'latest-final'}));
}
async function snapshotState() {
  const events = await reader.readContract({address: ADDRESS, functionName: 'get_all_events', args: [], transactionHashVariant: 'latest-final'});
  const tickets = await reader.readContract({address: ADDRESS, functionName: 'get_all_tickets', args: [], transactionHashVariant: 'latest-final'});
  const counts = await readCounts();
  const credits = {};
  for (const k of Object.keys(accounts)) credits[k] = (await readCredit(accounts[k].address)).credit_wei;
  return JSON.stringify({events, tickets, counts, credits});
}
async function resolvePending() {
  if (!cp.pending) return;
  const {label, hash} = cp.pending;
  console.log('resolving pending tx:', label, hash);
  const tx = await reader.waitForTransactionReceipt({hash, status: 'FINALIZED', interval: 5000, retries: 12, fullTransaction: true});
  if (label.startsWith('neg')) {
    const code = NEG_ERRORS[label];
    if (!errorObserved(tx, code)) throw new Error('pending ' + label + ' did not show expected error ' + code);
    record(label, hash, 'error-observed', {expected_error: code, unchanged_state: true});
  } else if (SETTLE_INFO[label]) {
    if ([5, 'MAJORITY_DISAGREE'].includes(tx.result)) {
      const n = Object.keys(done).filter((k) => k.startsWith(label + '-attempt-')).length + 1;
      record(`${label}-attempt-${n}`, hash, 'disagreed-retry');
    } else if (good(tx)) {
      const e = await readEvent(label === 's1-settle-e1' ? 1 : 2);
      if (e.verdict !== SETTLE_INFO[label].verdict) throw new Error('pending ' + label + ' WRONG VERDICT: expected ' + SETTLE_INFO[label].verdict + ', got ' + e.verdict);
      record(label, hash, 'ok', {verdict: e.verdict, caller: SETTLE_INFO[label].caller});
    } else throw new Error('pending ' + label + ' settle tx not good: ' + JSON.stringify(tx).slice(0, 300));
  } else {
    if (!good(tx)) throw new Error('pending ' + label + ' did not reach FINALIZED+AGREE+SUCCESS: ' + JSON.stringify(tx).slice(0, 300));
    record(label, hash, 'ok');
  }
  delete cp.pending; saveCheckpoint(cp);
  console.log('pending resolved:', label, hash);
}
async function writeOk(label, who, fn, args, value = 0n) {
  if (done[label]) { console.log(label, 'already done:', done[label]); return done[label]; }
  await sleep(1000);
  await resolvePending();
  if (done[label]) { console.log(label, 'resolved as done:', done[label]); return done[label]; }
  const hash = await clients[who].writeContract({address: ADDRESS, functionName: fn, args, value, leaderOnly: false});
  cp.pending = {label, hash}; saveCheckpoint(cp);
  const tx = await collect(clients[who], hash, label);
  delete cp.pending; saveCheckpoint(cp);
  if (!good(tx)) throw new Error(label + ' did not reach FINALIZED+AGREE+SUCCESS: ' + JSON.stringify(tx).slice(0, 400));
  record(label, hash, 'ok');
  return hash;
}
async function writeErr(label, who, fn, args, code, value = 0n) {
  if (done[label]) { console.log(label, 'already done:', done[label]); return done[label]; }
  await sleep(1000);
  await resolvePending();
  if (done[label]) { console.log(label, 'resolved as done:', done[label]); return done[label]; }
  const before = await snapshotState();
  const hash = await clients[who].writeContract({address: ADDRESS, functionName: fn, args, value, leaderOnly: false});
  cp.pending = {label, hash}; saveCheckpoint(cp);
  const tx = await collect(clients[who], hash, label);
  delete cp.pending; saveCheckpoint(cp);
  if (!errorObserved(tx, code)) throw new Error(label + ' did not show expected error ' + code + ' (leader payload: ' + leaderError(tx) + '): ' + JSON.stringify(tx).slice(0, 400));
  const after = await snapshotState();
  if (before !== after) throw new Error(label + ' changed state');
  record(label, hash, 'error-observed', {expected_error: code, unchanged_state: true});
  return hash;
}
async function settleFlow(label, eventId, expectedVerdict, caller = 'OUT') {
  if (done[label]) { console.log(label, 'already done:', done[label]); return done[label]; }
  await resolvePending();
  if (done[label]) { console.log(label, 'resolved as done:', done[label]); return done[label]; }
  for (let attempt = 1; attempt <= 3; attempt++) {
    await sleep(1000);
    const hash = await clients[caller].writeContract({address: ADDRESS, functionName: 'settle_event', args: [eventId], value: 0n, leaderOnly: false});
    cp.pending = {label, hash}; saveCheckpoint(cp);
    const tx = await collect(clients[caller], hash, `${label} attempt ${attempt} (caller ${caller})`);
    delete cp.pending; saveCheckpoint(cp);
    if ([5, 'MAJORITY_DISAGREE'].includes(tx.result)) {
      console.log(label, 'consensus disagreed (attempt', attempt + '), retrying — nothing changed');
      record(`${label}-attempt-${attempt}`, hash, 'disagreed-retry');
      continue;
    }
    if (!good(tx)) throw new Error(label + ' settle tx not good: ' + JSON.stringify(tx).slice(0, 400));
    const e = await readEvent(eventId);
    if (e.verdict !== expectedVerdict) {
      throw new Error(label + ' WRONG VERDICT: expected ' + expectedVerdict + ', got ' + e.verdict + ' — aborting, inspect, never paper over');
    }
    record(label, hash, 'ok', {verdict: e.verdict, attempts: attempt, caller});
    return hash;
  }
  throw new Error(label + ' consensus disagreed 3 times — aborting');
}
async function withdrawFlow(label, who, expectedWei) {
  if (done[label]) { console.log(label, 'already done:', done[label]); return done[label]; }
  await sleep(1000);
  await resolvePending();
  if (done[label]) { console.log(label, 'resolved as done:', done[label]); return done[label]; }
  const before = (await readCredit(accounts[who].address)).credit_wei;
  if (before !== expectedWei) throw new Error(label + ' credit before withdraw is ' + before + ', expected ' + expectedWei);
  const hash = await clients[who].writeContract({address: ADDRESS, functionName: 'withdraw', args: [], value: 0n, leaderOnly: false});
  cp.pending = {label, hash}; saveCheckpoint(cp);
  const tx = await collect(clients[who], hash, label);
  delete cp.pending; saveCheckpoint(cp);
  if (!good(tx)) throw new Error(label + ' withdraw tx not good: ' + JSON.stringify(tx).slice(0, 400));
  const after = (await readCredit(accounts[who].address)).credit_wei;
  if (after !== 0) throw new Error(label + ' credit after withdraw is ' + after + ', expected 0');
  record(label, hash, 'ok', {withdrawn_wei: expectedWei});
  return hash;
}
async function buyTicketFlow(label, who, eventId, priceGen) {
  if (ev.tickets[label]) { console.log(label, 'already created as id', ev.tickets[label]); return ev.tickets[label]; }
  await writeOk(label, who, 'buy_ticket', [eventId], BigInt(priceGen) * GEN);
  const id = (await readCounts()).ticket_count;
  ev.tickets[label] = id;
  saveCheckpoint(cp);
  console.log(label, 'is ticket id', id);
  return id;
}

const org = accounts.ORG.address.toLowerCase();
const art = accounts.ART.address.toLowerCase();

// A. Launch configuration.
await writeOk('cfg-e1', 'ORG', 'configure_event', [1, org, art]);
await writeOk('cfg-e2', 'ORG', 'configure_event', [2, org, art]);
await writeOk('cfg-e3', 'ORG', 'configure_event', [3, org, art]);

// B. Primary sales (10 GEN each).
const t1 = await buyTicketFlow('t1-buy', 'B1', 1, 10);
const t2 = await buyTicketFlow('t2-buy', 'B2', 1, 10);
const t3 = await buyTicketFlow('t3-buy', 'B1', 2, 10);
const t4 = await buyTicketFlow('t4-buy', 'B2', 2, 10);
const t5 = await buyTicketFlow('t5-buy', 'B1', 3, 10);
const t6 = await buyTicketFlow('t6-buy', 'B2', 3, 10);

// C. Resale happy path.
await writeOk('r1-list', 'B1', 'list_resale', [t1, 11]);
await writeOk('r1-buy', 'B2', 'buy_resale', [t1], 11n * GEN);
await writeOk('r2-list', 'B2', 'list_resale', [t2, 10]);
await writeOk('r2-buy', 'B1', 'buy_resale', [t2], 10n * GEN);
await writeOk('r3-list', 'B1', 'list_resale', [t3, 11]);
await writeOk('r4-list', 'B1', 'list_resale', [t5, 11]);
await writeOk('r4-buy', 'B2', 'buy_resale', [t5], 11n * GEN);

// D. Resale + purchase negatives (exact errors, 0 GEN on failed payables).
await writeErr('neg3-stranger-list', 'B2', 'list_resale', [t2, 10], 'NOT_TICKET_OWNER');
await writeErr('neg4-over-cap', 'B2', 'list_resale', [t1, 12], 'PRICE_CAP');
await writeOk('neg6-list', 'B1', 'list_resale', [t2, 11]);
await writeErr('neg6-self-buy', 'B1', 'buy_resale', [t2], 'SELF_PURCHASE', 0n);
await writeOk('neg6-cancel', 'B1', 'cancel_resale', [t2]);
await writeErr('neg5-not-listed', 'B2', 'buy_resale', [t4], 'TICKET_NOT_LISTED', 0n);
await writeErr('neg2-wrong-value', 'B1', 'buy_ticket', [1], 'VALUE_MUST_EQUAL_PRICE', 0n);
await writeErr('neg1-unknown-event', 'B1', 'buy_ticket', [99], 'EVENT_NOT_FOUND', 0n);

// E. Settlements (caller OUT; consensus decides).
await settleFlow('s1-settle-e1', 1, 'EVENT_HELD');
await settleFlow('s2-settle-e2', 2, 'CANCELLED');

// F. Post-settlement negatives.
await writeErr('neg9-double-settle', 'OUT', 'settle_event', [1], 'EVENT_ALREADY_SETTLED');
await writeErr('neg11-buy-held', 'B1', 'buy_ticket', [1], 'EVENT_NOT_ON_SALE', 0n);
await writeErr('neg10-list-refunded', 'B1', 'list_resale', [t3, 10], 'TICKET_NOT_ACTIVE');
await writeErr('neg7-stranger-withdraw', 'OUT', 'withdraw', [], 'NO_CREDIT');

// G. Withdrawals (exact credits).
await withdrawFlow('w-org', 'ORG', 20000000000000000000);
await withdrawFlow('w-art', 'ART', 3200000000000000000);
await withdrawFlow('w-b1', 'B1', 29800000000000000000);
await withdrawFlow('w-b2', 'B2', 19000000000000000000);
await writeErr('neg8-double-withdraw', 'ORG', 'withdraw', [], 'NO_CREDIT');

// Final readback vs EXPECTED.md.
const e1 = await readEvent(1);
const e2 = await readEvent(2);
const e3 = await readEvent(3);
console.log('E1:', JSON.stringify(e1));
console.log('E2:', JSON.stringify(e2));
console.log('E3:', JSON.stringify(e3));
if (e1.status !== 'EVENT_HELD' || e1.verdict !== 'EVENT_HELD' || e1.tickets_sold !== 2 || e1.escrowed_wei !== 0 || e1.organizer_paid !== true || e1.settle_count !== 1) throw new Error('E1 does not match EXPECTED.md');
if (e2.status !== 'CANCELLED' || e2.verdict !== 'CANCELLED' || e2.tickets_sold !== 2 || e2.escrowed_wei !== 0 || e2.settle_count !== 1) throw new Error('E2 does not match EXPECTED.md');
if (e3.status !== 'ON_SALE' || e3.verdict !== '' || e3.tickets_sold !== 2 || e3.escrowed_wei !== 20000000000000000000 || e3.organizer_paid !== false || e3.settle_count !== 0) throw new Error('E3 does not match EXPECTED.md');
const tk1 = await readTicket(t1);
const tk2 = await readTicket(t2);
const tk3 = await readTicket(t3);
const tk4 = await readTicket(t4);
const tk5 = await readTicket(t5);
const tk6 = await readTicket(t6);
console.log('tickets:', JSON.stringify([tk1, tk2, tk3, tk4, tk5, tk6]));
if (tk1.status !== 'ACTIVE' || tk1.owner !== accounts.B2.address.toLowerCase()) throw new Error('ticket 1 does not match EXPECTED.md');
if (tk2.status !== 'ACTIVE' || tk2.owner !== accounts.B1.address.toLowerCase()) throw new Error('ticket 2 does not match EXPECTED.md');
if (tk3.status !== 'REFUNDED' || tk3.owner !== accounts.B1.address.toLowerCase()) throw new Error('ticket 3 does not match EXPECTED.md');
if (tk4.status !== 'REFUNDED' || tk4.owner !== accounts.B2.address.toLowerCase()) throw new Error('ticket 4 does not match EXPECTED.md');
if (tk5.status !== 'ACTIVE' || tk5.owner !== accounts.B2.address.toLowerCase()) throw new Error('ticket 5 does not match EXPECTED.md');
if (tk6.status !== 'ACTIVE' || tk6.owner !== accounts.B2.address.toLowerCase()) throw new Error('ticket 6 does not match EXPECTED.md');
for (const k of Object.keys(accounts)) {
  const c = await readCredit(accounts[k].address);
  if (c.credit_wei !== 0) throw new Error(k + ' credit is not 0 after withdrawals: ' + c.credit_wei);
}
const counts = await readCounts();
console.log('counts:', JSON.stringify(counts));
if (counts.event_count !== 3 || counts.ticket_count !== 6
  || counts.total_received_wei !== 92000000000000000000
  || counts.total_withdrawn_wei !== 72000000000000000000
  || counts.contract_balance_wei !== 20000000000000000000 || counts.escrowed_wei !== 20000000000000000000
  || counts.total_royalties_wei !== 3200000000000000000
  || counts.total_resale_volume_wei !== 32000000000000000000) {
  throw new Error('LEDGER MISMATCH: expected 92 GEN in, 72 out, balance 20 (E3 live escrow), royalties 3.2, resale volume 32');
}

fs.mkdirSync(path.dirname(TX_PATH), {recursive: true});
fs.writeFileSync(TX_PATH, JSON.stringify({network: 'Stable Studionet', chain_id: CHAIN_ID, contract_address: ADDRESS, deploy_tx: cp.deploy_tx, complete: true, transactions: records}, null, 2));
console.log('evidence complete:', records.length, 'txs recorded in', TX_PATH);
console.log('ALL EXPECTED OUTCOMES MATCH. 92 GEN in = 72 out + 20 GEN live E3 escrow (zero stranded value), royalties 3.2 GEN.');
