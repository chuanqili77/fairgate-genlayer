// FairGate: full evidence run on Stable Studionet (61999), v1.3.
// Pre-registered expectations: EXPECTED.md (written before this run).
// 5 pre-configure negatives (incl. BAD_SETTLE_AFTER_TS on a wrong
// settlement timestamp and BAD_TZ_OFFSET on an out-of-range offset)
// + 4 configs (explicit UTC start + settlement timestamps, local
// UTC offset per event, contract-derived settlement timestamp)
// + 7 primary sales (E4 sells 1 ticket so rescheduling is proven
// against a real ticket, holder and escrow) + 7 resale + 8
// resale/purchase negatives + 1 early-settle negative (TOO_EARLY on
// E3, now a Unix-timestamp gate) + 3 settlements (E1 HELD, E2
// CANCELLED, E4 POSTPONED under the scoped extractor) + 9
// reschedule steps (6 negatives + 2 reschedules + 1 TOO_EARLY
// settle after rescheduling) + 4 post-settlement negatives + 5
// withdrawals = 53 txs + deploy.
// E3 (Pentatonix, 2026-12-09 19:00 Nashville CST) is deliberately
// NOT settled: its settlement timestamp is 2026-12-10T06:00:00Z
// and the on-chain timestamp gate refuses settlement before it
// (proven by neg13, TOO_EARLY). It stays ON_SALE with tickets
// available so the live site has a real usable flow. Its 20 GEN
// escrow stays open by design (see EXPECTED.md ledger split).
// E4 (KATSEYE, 2026-11-07) is settled POSTPONED on-chain, then
// rescheduled twice (2027-01-16, then 2027-02-20); each reschedule
// is verified to keep the ticket, the holder and the 10 GEN escrow
// untouched and to move no money. A settle attempt after
// rescheduling is refused TOO_EARLY under the new timestamp.
// Resumable: progress is saved to a local state file. Temp accounts
// live ONLY in that file (outside the repo, mode 0600).
// IMPORTANT: do NOT delete the state file after this run — the ORG
// (organizer) key is retained in it so E3's organizer credit can be
// withdrawn after E3 settles after 2026-12-09 (see EXPECTED.md).
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
const CHECKPOINT = opt('--checkpoint', path.resolve(REPO, '..', '.fairgate-checkpoint-v1.3.json'));
const TX_PATH = path.join(REPO, 'evidence', 'transactions.json');
const GEN = 1000000000000000000n;

// Event start / settlement timestamps (UTC seconds) and local offsets.
// Offsets verified against the IANA zone for each event date:
// E1 London 2025-07-25 BST +60; E2 Nashville 2024-08-06 CDT -300;
// E3 Nashville 2026-12-09 CST -360; E4 Minneapolis 2026-11-07 CST -360.
// settle_after = first second of the day after the show, local time.
const EV = {
  1: {start: 1753466400, settle: 1753484400, offset: 60, tz: 'Europe/London'},
  2: {start: 1722992400, settle: 1723006800, offset: -300, tz: 'America/Chicago'},
  3: {start: 1796864400, settle: 1796882400, offset: -360, tz: 'America/Chicago'},
  4: {start: 1794103200, settle: 1794117600, offset: -360, tz: 'America/Chicago'},
};
const RS1 = {start: 1800151200, settle: 1800165600, offset: -360, tz: 'America/Chicago', date: '2027-01-16', display: '16 January 2027, 8:00 PM'};
const RS2 = {start: 1803175200, settle: 1803189600, offset: -360, tz: 'America/Chicago', date: '2027-02-20', display: '20 February 2027, 8:00 PM'};

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
const SETTLE_INFO = {
  's1-settle-e1': {verdict: 'EVENT_HELD', caller: 'OUT'},
  's2-settle-e2': {verdict: 'CANCELLED', caller: 'OUT'},
  's3-settle-e4': {verdict: 'POSTPONED', caller: 'OUT'},
};
const LABEL_ORDER = ['neg0-not-creator', 'neg14-bad-address', 'neg15-bad-settle-after', 'neg16-bad-tz-offset', 'neg12-buy-unconfigured',
  'cfg-e1', 'cfg-e2', 'cfg-e3', 'cfg-e4',
  't1-buy', 't2-buy', 't3-buy', 't4-buy', 't5-buy', 't6-buy', 't7-buy',
  'r1-list', 'r1-buy', 'r2-list', 'r2-buy', 'r3-list', 'r4-list', 'r4-buy',
  'neg3-stranger-list', 'neg4-over-cap', 'neg6-list', 'neg6-self-buy',
  'neg6-cancel', 'neg5-not-listed', 'neg2-wrong-value', 'neg1-unknown-event',
  'neg13-early-settle-e3',
  's1-settle-e1', 's2-settle-e2', 's3-settle-e4',
  'neg18-rsch-stranger', 'neg19-rsch-onsale', 'neg20-rsch-earlier',
  'neg21-rsch-settled-e1', 'neg22-rsch-settled-e2', 'neg23-rsch-bad-settle',
  'rsch1', 'rsch2', 'neg17-settle-after-rsch',
  'neg9-double-settle', 'neg11-buy-held', 'neg10-list-refunded',
  'neg7-stranger-withdraw',
  'w-org', 'w-art', 'w-b1', 'w-b2', 'neg8-double-withdraw'];
for (const label of LABEL_ORDER) {
  const hash = done[label];
  if (!hash) continue;
  if (label === 'neg6-list' || label === 'neg6-cancel') records.push({label, hash, result: 'ok'});
  else if (label.startsWith('neg')) records.push({label, hash, result: 'error-observed', expected_error: NEG_ERRORS[label]});
  else if (/-attempt-\d+$/.test(label)) records.push({label, hash, result: 'disagreed-retry'});
  else if (SETTLE_INFO[label]) records.push({label, hash, result: 'ok', ...SETTLE_INFO[label]});
  else records.push({label, hash, result: 'ok'});
}
for (const label of Object.keys(done).sort()) {
  if (LABEL_ORDER.includes(label)) continue;
  const hash = done[label];
  if (label === 'neg6-list' || label === 'neg6-cancel') records.push({label, hash, result: 'ok'});
  else if (label.startsWith('neg')) records.push({label, hash, result: 'error-observed', expected_error: NEG_ERRORS[label]});
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
      const e = await readEvent(label === 's1-settle-e1' ? 1 : label === 's2-settle-e2' ? 2 : 4);
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
async function rescheduleFlow(label, rs) {
  // Reschedule E4 and verify the preservation invariants live:
  // status stays POSTPONED, the new timestamps/date are stored,
  // ticket 7 stays ACTIVE with the same owner, the 10 GEN escrow
  // is untouched, and no credit appears for ORG or ART.
  if (done[label]) { console.log(label, 'already done:', done[label]); return done[label]; }
  await sleep(1000);
  await resolvePending();
  if (done[label]) { console.log(label, 'resolved as done:', done[label]); return done[label]; }
  const before = await readEvent(4);
  const t7before = await readTicket(7);
  const orgBefore = (await readCredit(accounts.ORG.address)).credit_wei;
  const artBefore = (await readCredit(accounts.ART.address)).credit_wei;
  const hash = await clients.P1.writeContract({address: ADDRESS, functionName: 'reschedule_event', args: [4, rs.start, rs.settle, rs.offset, rs.date, rs.display, rs.tz], value: 0n, leaderOnly: false});
  cp.pending = {label, hash}; saveCheckpoint(cp);
  const tx = await collect(clients.P1, hash, label);
  delete cp.pending; saveCheckpoint(cp);
  if (!good(tx)) throw new Error(label + ' reschedule tx not good: ' + JSON.stringify(tx).slice(0, 400));
  const after = await readEvent(4);
  const t7after = await readTicket(7);
  const orgAfter = (await readCredit(accounts.ORG.address)).credit_wei;
  const artAfter = (await readCredit(accounts.ART.address)).credit_wei;
  if (after.status !== 'POSTPONED') throw new Error(label + ' status is ' + after.status + ', expected POSTPONED');
  if (after.event_start_ts !== rs.start || after.settle_after_ts !== rs.settle) throw new Error(label + ' timestamps not stored: ' + JSON.stringify(after));
  if (after.date_iso !== rs.date) throw new Error(label + ' date_iso is ' + after.date_iso + ', expected ' + rs.date);
  if (after.settle_count !== before.settle_count) throw new Error(label + ' settle_count changed');
  if (after.escrowed_wei !== before.escrowed_wei || after.escrowed_wei !== 10000000000000000000) throw new Error(label + ' escrow changed: ' + after.escrowed_wei);
  if (t7after.status !== 'ACTIVE' || t7after.owner !== t7before.owner) throw new Error(label + ' ticket 7 changed: ' + JSON.stringify(t7after));
  if (orgAfter !== orgBefore || artAfter !== artBefore) throw new Error(label + ' money moved to ORG/ART during reschedule');
  record(label, hash, 'ok', {new_date: rs.date, new_settle_after_ts: rs.settle});
  return hash;
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
function cfgArgs(id) {
  const e = EV[id];
  return [id, accounts.ORG.address.toLowerCase(), accounts.ART.address.toLowerCase(), e.start, e.settle, e.offset, e.tz];
}

const org = accounts.ORG.address.toLowerCase();
const art = accounts.ART.address.toLowerCase();

// A. Pre-configure negatives (before any event is configured).
await writeErr('neg0-not-creator', 'OUT', 'configure_event', [1, org, art, EV[1].start, EV[1].settle, EV[1].offset, EV[1].tz], 'NOT_CREATOR');
await writeErr('neg14-bad-address', 'P1', 'configure_event', [1, '0x123', art, EV[1].start, EV[1].settle, EV[1].offset, EV[1].tz], 'BAD_ADDRESS');
await writeErr('neg15-bad-settle-after', 'P1', 'configure_event', [1, org, art, EV[1].start, EV[1].settle + 3600, EV[1].offset, EV[1].tz], 'BAD_SETTLE_AFTER_TS');
await writeErr('neg16-bad-tz-offset', 'P1', 'configure_event', [1, org, art, EV[1].start, EV[1].settle, 9999, EV[1].tz], 'BAD_TZ_OFFSET');
await writeErr('neg12-buy-unconfigured', 'B1', 'buy_ticket', [1], 'EVENT_NOT_CONFIGURED', 0n);

// B. Launch configuration (creator P1 only, explicit timestamps).
await writeOk('cfg-e1', 'P1', 'configure_event', cfgArgs(1));
await writeOk('cfg-e2', 'P1', 'configure_event', cfgArgs(2));
await writeOk('cfg-e3', 'P1', 'configure_event', cfgArgs(3));
await writeOk('cfg-e4', 'P1', 'configure_event', cfgArgs(4));

// C. Primary sales (10 GEN each). E4 sells 1 ticket: the reschedule
// preservation check needs a real ticket, holder and escrow.
const t1 = await buyTicketFlow('t1-buy', 'B1', 1, 10);
const t2 = await buyTicketFlow('t2-buy', 'B2', 1, 10);
const t3 = await buyTicketFlow('t3-buy', 'B1', 2, 10);
const t4 = await buyTicketFlow('t4-buy', 'B2', 2, 10);
const t5 = await buyTicketFlow('t5-buy', 'B1', 3, 10);
const t6 = await buyTicketFlow('t6-buy', 'B2', 3, 10);
const t7 = await buyTicketFlow('t7-buy', 'B1', 4, 10);

// D. Resale happy path.
await writeOk('r1-list', 'B1', 'list_resale', [t1, 11]);
await writeOk('r1-buy', 'B2', 'buy_resale', [t1], 11n * GEN);
await writeOk('r2-list', 'B2', 'list_resale', [t2, 10]);
await writeOk('r2-buy', 'B1', 'buy_resale', [t2], 10n * GEN);
await writeOk('r3-list', 'B1', 'list_resale', [t3, 11]);
await writeOk('r4-list', 'B1', 'list_resale', [t5, 11]);
await writeOk('r4-buy', 'B2', 'buy_resale', [t5], 11n * GEN);

// E. Resale + purchase negatives (exact errors, 0 GEN on failed payables).
await writeErr('neg3-stranger-list', 'B2', 'list_resale', [t2, 10], 'NOT_TICKET_OWNER');
await writeErr('neg4-over-cap', 'B2', 'list_resale', [t1, 12], 'PRICE_CAP');
await writeOk('neg6-list', 'B1', 'list_resale', [t2, 11]);
await writeErr('neg6-self-buy', 'B1', 'buy_resale', [t2], 'SELF_PURCHASE', 0n);
await writeOk('neg6-cancel', 'B1', 'cancel_resale', [t2]);
await writeErr('neg5-not-listed', 'B2', 'buy_resale', [t4], 'TICKET_NOT_LISTED', 0n);
await writeErr('neg2-wrong-value', 'B1', 'buy_ticket', [1], 'VALUE_MUST_EQUAL_PRICE', 0n);
await writeErr('neg1-unknown-event', 'B1', 'buy_ticket', [99], 'EVENT_NOT_FOUND', 0n);

// F. Early-settlement negative: the timestamp gate refuses E3 before
// 2026-12-10T06:00:00Z (its settlement timestamp).
await writeErr('neg13-early-settle-e3', 'OUT', 'settle_event', [3], 'TOO_EARLY');

// G. Settlements (caller OUT; consensus decides; timestamp gate passed for E1/E2/E4).
await settleFlow('s1-settle-e1', 1, 'EVENT_HELD');
await settleFlow('s2-settle-e2', 2, 'CANCELLED');
await settleFlow('s3-settle-e4', 4, 'POSTPONED');

// H. Reschedule negatives, then two reschedules, then a settle attempt
// under the new timestamp (refused TOO_EARLY).
await writeErr('neg18-rsch-stranger', 'OUT', 'reschedule_event', [4, RS1.start, RS1.settle, RS1.offset, RS1.date, RS1.display, RS1.tz], 'NOT_CREATOR');
await writeErr('neg19-rsch-onsale', 'P1', 'reschedule_event', [3, RS1.start, RS1.settle, RS1.offset, RS1.date, RS1.display, RS1.tz], 'NOT_POSTPONED');
await writeErr('neg20-rsch-earlier', 'P1', 'reschedule_event', [4, EV[4].start - 518400, EV[4].settle - 518400, -360, '2026-11-01', '1 November 2026, 8:00 PM', 'America/Chicago'], 'DATE_NOT_LATER');
await writeErr('neg21-rsch-settled-e1', 'P1', 'reschedule_event', [1, RS1.start, RS1.settle, RS1.offset, RS1.date, RS1.display, RS1.tz], 'NOT_POSTPONED');
await writeErr('neg22-rsch-settled-e2', 'P1', 'reschedule_event', [2, RS1.start, RS1.settle, RS1.offset, RS1.date, RS1.display, RS1.tz], 'NOT_POSTPONED');
await writeErr('neg23-rsch-bad-settle', 'P1', 'reschedule_event', [4, RS1.start, RS1.settle + 1, RS1.offset, RS1.date, RS1.display, RS1.tz], 'BAD_SETTLE_AFTER_TS');
await rescheduleFlow('rsch1', RS1);
await rescheduleFlow('rsch2', RS2);
await writeErr('neg17-settle-after-rsch', 'OUT', 'settle_event', [4], 'TOO_EARLY');

// I. Post-settlement negatives.
await writeErr('neg9-double-settle', 'OUT', 'settle_event', [1], 'EVENT_ALREADY_SETTLED');
await writeErr('neg11-buy-held', 'B1', 'buy_ticket', [1], 'EVENT_NOT_ON_SALE', 0n);
await writeErr('neg10-list-refunded', 'B1', 'list_resale', [t3, 10], 'TICKET_NOT_ACTIVE');
await writeErr('neg7-stranger-withdraw', 'OUT', 'withdraw', [], 'NO_CREDIT');

// J. Withdrawals (exact credits).
await withdrawFlow('w-org', 'ORG', 20000000000000000000);
await withdrawFlow('w-art', 'ART', 3200000000000000000);
await withdrawFlow('w-b1', 'B1', 29800000000000000000);
await withdrawFlow('w-b2', 'B2', 19000000000000000000);
await writeErr('neg8-double-withdraw', 'ORG', 'withdraw', [], 'NO_CREDIT');

// Final readback vs EXPECTED.md.
const e1 = await readEvent(1);
const e2 = await readEvent(2);
const e3 = await readEvent(3);
const e4 = await readEvent(4);
console.log('E1:', JSON.stringify(e1));
console.log('E2:', JSON.stringify(e2));
console.log('E3:', JSON.stringify(e3));
console.log('E4:', JSON.stringify(e4));
if (e1.status !== 'EVENT_HELD' || e1.verdict !== 'EVENT_HELD' || e1.tickets_sold !== 2 || e1.escrowed_wei !== 0 || e1.organizer_paid !== true || e1.settle_count !== 1
  || e1.event_start_ts !== EV[1].start || e1.settle_after_ts !== EV[1].settle || e1.tz_offset_min !== 60) throw new Error('E1 does not match EXPECTED.md');
if (e2.status !== 'CANCELLED' || e2.verdict !== 'CANCELLED' || e2.tickets_sold !== 2 || e2.escrowed_wei !== 0 || e2.settle_count !== 1
  || e2.event_start_ts !== EV[2].start || e2.settle_after_ts !== EV[2].settle || e2.tz_offset_min !== -300) throw new Error('E2 does not match EXPECTED.md');
if (e3.status !== 'ON_SALE' || e3.verdict !== '' || e3.tickets_sold !== 2 || e3.escrowed_wei !== 20000000000000000000 || e3.organizer_paid !== false || e3.settle_count !== 0
  || e3.event_start_ts !== EV[3].start || e3.settle_after_ts !== EV[3].settle || e3.tz_offset_min !== -360) throw new Error('E3 does not match EXPECTED.md');
if (e4.status !== 'POSTPONED' || e4.verdict !== 'POSTPONED' || e4.tickets_sold !== 1 || e4.escrowed_wei !== 10000000000000000000 || e4.organizer_paid !== false || e4.settle_count !== 1
  || e4.event_start_ts !== RS2.start || e4.settle_after_ts !== RS2.settle || e4.tz_offset_min !== -360 || e4.date_iso !== RS2.date) throw new Error('E4 does not match EXPECTED.md');
const tk1 = await readTicket(t1);
const tk2 = await readTicket(t2);
const tk3 = await readTicket(t3);
const tk4 = await readTicket(t4);
const tk5 = await readTicket(t5);
const tk6 = await readTicket(t6);
const tk7 = await readTicket(t7);
console.log('tickets:', JSON.stringify([tk1, tk2, tk3, tk4, tk5, tk6, tk7]));
if (tk1.status !== 'ACTIVE' || tk1.owner !== accounts.B2.address.toLowerCase()) throw new Error('ticket 1 does not match EXPECTED.md');
if (tk2.status !== 'ACTIVE' || tk2.owner !== accounts.B1.address.toLowerCase()) throw new Error('ticket 2 does not match EXPECTED.md');
if (tk3.status !== 'REFUNDED' || tk3.owner !== accounts.B1.address.toLowerCase()) throw new Error('ticket 3 does not match EXPECTED.md');
if (tk4.status !== 'REFUNDED' || tk4.owner !== accounts.B2.address.toLowerCase()) throw new Error('ticket 4 does not match EXPECTED.md');
if (tk5.status !== 'ACTIVE' || tk5.owner !== accounts.B2.address.toLowerCase()) throw new Error('ticket 5 does not match EXPECTED.md');
if (tk6.status !== 'ACTIVE' || tk6.owner !== accounts.B2.address.toLowerCase()) throw new Error('ticket 6 does not match EXPECTED.md');
if (tk7.status !== 'ACTIVE' || tk7.owner !== accounts.B1.address.toLowerCase()) throw new Error('ticket 7 does not match EXPECTED.md');
for (const k of Object.keys(accounts)) {
  const c = await readCredit(accounts[k].address);
  if (c.credit_wei !== 0) throw new Error(k + ' credit is not 0 after withdrawals: ' + c.credit_wei);
}
const counts = await readCounts();
console.log('counts:', JSON.stringify(counts));
if (counts.event_count !== 4 || counts.ticket_count !== 7
  || counts.total_received_wei !== 102000000000000000000
  || counts.total_withdrawn_wei !== 72000000000000000000
  || counts.contract_balance_wei !== 30000000000000000000 || counts.escrowed_wei !== 30000000000000000000
  || counts.total_royalties_wei !== 3200000000000000000
  || counts.total_resale_volume_wei !== 32000000000000000000) {
  throw new Error('LEDGER MISMATCH: expected 102 GEN in, 72 out, balance 30 (E3 20 + E4 10 escrow), royalties 3.2, resale volume 32');
}

fs.mkdirSync(path.dirname(TX_PATH), {recursive: true});
fs.writeFileSync(TX_PATH, JSON.stringify({network: 'Stable Studionet', chain_id: CHAIN_ID, contract_address: ADDRESS, deploy_tx: cp.deploy_tx, complete: true, transactions: records}, null, 2));
console.log('evidence complete:', records.length, 'txs recorded in', TX_PATH);
console.log('ALL EXPECTED OUTCOMES MATCH. 102 GEN in = 72 out + 30 GEN escrow (E3 20 live + E4 10 postponed, zero stranded value), royalties 3.2 GEN.');
