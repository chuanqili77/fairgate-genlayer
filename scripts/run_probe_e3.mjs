// FairGate fetch probe runner: probe the 4 anchor URLs (+1 alternate)
// through the deployed probe contract and print each result.
// Usage: node scripts/run_probe.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createClient, createAccount} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECKPOINT = path.resolve(REPO, '..', '.fairgate-probe-checkpoint.json');
const DEPLOY = JSON.parse(fs.readFileSync(path.resolve(REPO, '..', 'probe-deployment.json'), 'utf8'));
const ADDRESS = DEPLOY.contract_address;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function leaderExec(tx) {
  let r = tx.consensus_data?.leader_receipt;
  r = Array.isArray(r) ? r.find((x) => x.mode === 'leader') : r;
  return r?.execution_result;
}
function good(tx) {
  return [7, 'FINALIZED'].includes(tx.status)
    && [6, 'MAJORITY_AGREE'].includes(tx.result)
    && leaderExec(tx) === 'SUCCESS';
}

const cp = JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8'));
const account = createAccount(cp.wallets.P1);
const client = createClient({chain: studionet, account});
const reader = createClient({chain: studionet});
console.log('probe contract:', ADDRESS, 'P1:', account.address);

const URLS = [
  ['C1-pentatonix-bridgestone', 'https://www.bridgestonearena.com/events/detail/pentatonix-christmas-in-the-city-tour'],
  ['C2-pentatonix-do615', 'https://do615.com/events/2026/12/9/pentatonix-christmas-in-the-city-tour-tickets'],
];

const out = [];
for (const [label, url] of URLS) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await sleep(1000);
    const hash = await client.writeContract({address: ADDRESS, functionName: 'probe', args: [url], value: 0n, leaderOnly: false});
    console.log(label, 'tx', hash, 'attempt', attempt);
    const tx = await client.waitForTransactionReceipt({hash, status: 'FINALIZED', interval: 5000, retries: 12, fullTransaction: true});
    console.log(label, 'status=', tx.status, 'result=', tx.result, 'leader=', leaderExec(tx));
    if ([5, 'MAJORITY_DISAGREE'].includes(tx.result)) {
      console.log(label, 'consensus disagreed, retrying');
      continue;
    }
    if (!good(tx)) throw new Error(label + ' probe tx not good: ' + JSON.stringify(tx).slice(0, 400));
    const all = JSON.parse(await reader.readContract({address: ADDRESS, functionName: 'get_all_results', args: [], transactionHashVariant: 'latest-final'}));
    const rec = all[all.length - 1];
    console.log(label, '=>', JSON.stringify(rec));
    out.push({label, url, tx: hash, ...rec});
    break;
  }
}
fs.writeFileSync(path.resolve(REPO, '..', 'probe-e3-results.json'), JSON.stringify(out, null, 2));
console.log('probe done, wrote probe-e3-results.json');
