import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createClient } from 'genlayer-js-v2';
import { studionet } from 'genlayer-js-v2/chains';

const load = path => JSON.parse(readFileSync(path, 'utf8'));
const deployment = load('evidence/deployment-v2.json');
const evidence = load('evidence/v2-transactions.json');
const snapshot = load('evidence/v2-readback.json');
const browser = load('evidence/v2-browser.json');
const address = deployment.contract_address;
const reader = createClient({chain: studionet});
async function readEvents() {
  for (let attempt = 0; ; attempt++) {
    try {
      return JSON.parse(await reader.readContract({
        address, functionName: 'get_all_events', args: [], transactionHashVariant: 'latest-final',
      }));
    } catch (error) {
      if (attempt >= 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 1800 * (attempt + 1)));
    }
  }
}
assert.equal(await reader.getChainId(), 61999);
const source = readFileSync(deployment.source_file, 'utf8');
assert.equal(createHash('sha256').update(source).digest('hex'), deployment.source_sha256);
assert.equal(await reader.getContractCode(address), source);
assert.equal(evidence.contract_address, address);
const rows = [...evidence.transactions, ...browser.transactions];
async function verify(item) {
  const tx = await reader.getTransaction({hash:item.hash});
  const leader = [tx.consensus_data.leader_receipt].flat().find(record => record.mode === 'leader');
  assert.equal(tx.statusName, 'FINALIZED', item.label);
  assert.equal(tx.result_name, 'MAJORITY_AGREE', item.label);
  assert.equal(leader.execution_result, item.execution, item.label);
  assert.equal(tx.from_address.toLowerCase(), item.signer.toLowerCase(), item.label);
  assert.equal((tx.data?.contract_address || tx.to_address).toLowerCase(), address.toLowerCase(), item.label);
  if (item.expected_error) assert(JSON.stringify(leader).includes(item.expected_error), item.label);
}
for (let i = 0; i < rows.length; i += 4) await Promise.all(rows.slice(i, i + 4).map(verify));
const liveEvents = await readEvents();
const held = liveEvents.find(event => event.event_id === 1);
const cancelled = liveEvents.find(event => event.event_id === 2);
assert.equal(held.verdict, 'EVENT_HELD');
assert.equal(cancelled.verdict, 'CANCELLED');
assert.notEqual(held.organizer, cancelled.organizer);
assert.equal(held.escrowed_wei, 0);
assert.equal(cancelled.escrowed_wei, 0);
assert.equal(snapshot.events.find(event => event.event_id === 3).escrowed_wei, 20e18);
assert.equal(snapshot.tickets.filter(ticket => ticket.event_id === 2 && ticket.status === 'REFUNDED').length, 2);
assert.equal(snapshot.tickets.find(ticket => ticket.ticket_id === 3).owner.toLowerCase(),
  rows.find(item => item.label === 'Buy resale ticket 3').signer.toLowerCase());
const count = snapshot.counts;
assert.equal(count.total_received_wei, count.total_withdrawn_wei + count.escrowed_wei);
assert.equal(count.contract_balance_wei, count.escrowed_wei);
console.log('Source byte parity, the recorded receipts, archived ledger conservation and the two terminal events were verified.');
