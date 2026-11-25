import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';
import { createAccount, createClient } from 'genlayer-js-v2';
import { studionet } from 'genlayer-js-v2/chains';

const reader = createClient({ chain: studionet });
const file = 'contracts/fairgate_v2.py';
const code = readFileSync(file, 'utf8');
const checkpoint = process.argv[2];
if (!checkpoint || resolve(checkpoint).startsWith(process.cwd() + sep)) {
  throw Error('Provide a private checkpoint path outside the repository.');
}
const { generatePrivateKey } = await import('genlayer-js-v2');
let cp;
try { cp = JSON.parse(readFileSync(checkpoint)); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  cp = { keys: Array.from({length: 5}, generatePrivateKey), hashes: {} };
}
const save = () => writeFileSync(checkpoint, JSON.stringify(cp), {mode: 0o600});
save();
const accounts = cp.keys.map(key => createAccount(key));
const wallets = accounts.map(account => createClient({ chain: studionet, account }));
const fees = await reader.estimateTransactionFees();
const budget = {distribution: fees.distribution, feeValue: fees.feeValue};
const unit = 10n ** 18n;
assert.equal(await reader.getChainId(), 61999);
const rows = [];
async function send(label, submit, expected = 'SUCCESS') {
  const hash = cp.hashes[label] ?? await submit();
  cp.hashes[label] = hash;
  save();
  console.log(label, hash);
  let tx;
  for (let n = 0; n < 130; n++) {
    tx = await reader.getTransaction({hash}).catch(() => null);
    if (tx?.statusName === 'FINALIZED') break;
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  const leader = [tx?.consensus_data?.leader_receipt].flat().find(x => x?.mode === 'leader');
  assert.equal(tx?.statusName, 'FINALIZED', label);
  assert.equal(tx.result_name ?? tx.result, 'MAJORITY_AGREE', label);
  assert.equal(leader?.execution_result, expected, label);
  const row = {label, hash, status: tx.statusName, execution: leader.execution_result, signer: tx.from_address};
  rows.push(row);
  writeFileSync('evidence/v2-transactions.json', JSON.stringify({contract_address: cp.address, transactions: rows}, null, 2)+'\n');
  return tx;
}
if (!cp.funded) {
  await Promise.all(accounts.map(account => reader.request({method: 'sim_fundAccount', params: [account.address, String(100n * unit)]})));
  cp.funded = true;
  save();
}
const deployment = await send('Deploy v2', () => wallets[0].deployContract({code, args: [], fees: budget, leaderOnly: false}));
const address = deployment.data.contract_address;
cp.address = address;
save();
assert.equal(await reader.getContractCode(address), code);
writeFileSync('evidence/deployment-v2.json', JSON.stringify({network: 'Stable Studionet', chain_id: 61999, contract_address: address, deploy_tx: deployment.hash, source_file: file, source_sha256: createHash('sha256').update(code).digest('hex')}, null, 2)+'\n');
const read = async (method, args = []) => JSON.parse(await reader.readContract({address,functionName: method,args,transactionHashVariant: 'latest-final'}));
const write = (idx, label, method, args, value = 0n, expected = 'SUCCESS') => send(label,
  () => wallets[idx].writeContract({ address, functionName: method, args, value, leaderOnly: false, fees: budget }), expected);
const old = createClient({chain: studionet});
for (let id = 1; id <= 3; id++) {
  const ev = JSON.parse(await old.readContract({address:'0x0c1327e107D6DA6f1ec6499b159576c7bAF721EE', functionName:'get_event', args:[id],transactionHashVariant:'latest-final'}));
  const display = id < 3 ? [id === 1 ? 'Oasis' : 'Metro Boomin', id === 1 ? 'Wembley' : 'Bridgestone'] : [ev.artist,ev.venue];
  await write(id % 2, 'Create event ' + id, 'create_event', [...display, ev.city, accounts[4].address, ev.event_start_ts, ev.tz_offset_min, ev.source_a_url, ev.source_b_url]);
}
for (const [buyer, id] of [[2,1],[3,1],[2,2],[3,2],[2,3],[3,3]]) {
  await write(buyer, 'Buy event ' + id + ' wallet ' + buyer, 'buy_ticket', [id], 10n * unit);
}
await write(2, 'List ticket 3', 'list_resale', [3,11]);
await write(3, 'Buy resale ticket 3', 'buy_resale', [3], 11n * unit);
await write(0, 'Foreign organizer cannot edit event 1', 'reschedule_event', [1, 0, 0, 0, '', '', ''], 0n, 'ERROR');
await write(2, 'Settle event 1', 'settle_event', [1]);
const afterFirst = await read('get_event',[1]);
assert.equal(afterFirst.verdict, 'EVENT_HELD');
if (!cp.hashes['Settle event 2']) assert.equal((await read('get_event',[2])).escrowed_wei, Number(20n * unit));
await write(3, 'Settle event 2', 'settle_event', [2]);
assert.equal((await read('get_event',[2])).verdict, 'CANCELLED');
assert.equal((await read('get_event',[3])).escrowed_wei, Number(20n * unit));
for (const idx of [1,2,3,4]) await write(idx, 'Withdraw wallet ' + idx, 'withdraw', []);
const counts = await read('get_counts');
assert.equal(counts.total_received_wei, counts.total_withdrawn_wei + counts.escrowed_wei);
assert.equal(counts.contract_balance_wei, counts.escrowed_wei);
writeFileSync('evidence/v2-readback.json', JSON.stringify({address, counts, events: await read('get_all_events'), tickets: await read('get_all_tickets'), observed_at: new Date().toISOString()}, null, 2)+'\n');
