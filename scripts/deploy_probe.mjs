// FairGate fetch probe: deploy contracts/probe.py on Stable Studionet.
// Temp account lives ONLY in a local checkpoint file outside the repo (mode 0600).
// (0600, deleted when the probe is done). The probe deployment is NOT
// part of the product evidence pack.
// Usage: node scripts/deploy_probe.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createClient, createAccount, generatePrivateKey} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';

const CHAIN_ID = 61999;
const RPC_URL = 'https://studio.genlayer.com/api';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECKPOINT = path.resolve(REPO, '..', '.fairgate-probe-checkpoint.json');
const CONTRACT_PATH = path.join(REPO, 'contracts', 'probe.py');
const OUT_PATH = path.resolve(REPO, '..', 'probe-deployment.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (s) => createHash('sha256').update(s).digest('hex');
function loadCheckpoint() {
  try { return JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8')); } catch { return {wallets: {}}; }
}
function saveCheckpoint(cp) {
  fs.mkdirSync(path.dirname(CHECKPOINT), {recursive: true});
  fs.writeFileSync(CHECKPOINT, JSON.stringify(cp, null, 2), {mode: 0o600});
  fs.chmodSync(CHECKPOINT, 0o600);
}
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
async function collect(client, hash, label) {
  console.log(label, hash);
  for (let i = 0; i < 3; i++) {
    try {
      const tx = await client.waitForTransactionReceipt({hash, status: 'FINALIZED', interval: 5000, retries: 12, fullTransaction: true});
      console.log(label, 'status=', tx.status, 'result=', tx.result, 'leader=', leaderExec(tx));
      return tx;
    } catch (e) {
      console.log('tracking', label, 'attempt', i, e.shortMessage || e.message);
      await sleep(5000);
    }
  }
  throw new Error('Timeout waiting for FINALIZED: ' + label + ' ' + hash);
}

const source = fs.readFileSync(CONTRACT_PATH, 'utf8');
console.log('probe source sha256:', sha(source), `(${Buffer.byteLength(source)} bytes)`);
const cp = loadCheckpoint();
if (!cp.wallets.P1) { cp.wallets.P1 = generatePrivateKey(); console.log('generated temp account P1'); }
cp.chain_id = CHAIN_ID;
cp.rpc = RPC_URL;
saveCheckpoint(cp);
const account = createAccount(cp.wallets.P1);
console.log('P1:', account.address);
const client = createClient({chain: studionet, account});
if ((await client.getChainId()) !== CHAIN_ID) throw new Error('WRONG_CHAIN');
const bal = await client.getBalance({address: account.address});
if (bal < 50000000000000000000n) {
  await client.request({method: 'sim_fundAccount', params: [account.address, 100000000000000000000]});
  console.log('P1 funded 100 GEN');
}
let address = cp.contract_address || null;
let deployTx = cp.deploy_tx || null;
if (address && deployTx) {
  console.log('resuming existing probe deploy', address, deployTx);
  const tx = await collect(client, deployTx, 'deploy (resume)');
  if (!good(tx)) throw new Error('recorded deploy tx is not good');
} else {
  await sleep(3000);
  if (cp.pending_deploy_tx) throw new Error('Unresolved deployment: ' + cp.pending_deploy_tx);
  const hash = await client.deployContract({code: source, args: [], value: 0n, leaderOnly: false});
  cp.pending_deploy_tx = hash;
  saveCheckpoint(cp);
  const tx = await collect(client, hash, 'deploy');
  if (!good(tx)) throw new Error('deploy failed: ' + JSON.stringify(tx));
  address = tx.data?.contract_address || tx.contract_address;
  if (!address) throw new Error('no contract address in deploy receipt');
  deployTx = hash;
  delete cp.pending_deploy_tx;
  cp.contract_address = address;
  cp.deploy_tx = deployTx;
  saveCheckpoint(cp);
}
await sleep(3000);
const onChain = await client.getContractCode(address);
if (onChain !== source) throw new Error('BYTE_PARITY_MISMATCH after deploy');
console.log('BYTE_PARITY_MATCH: TRUE');
fs.writeFileSync(OUT_PATH, JSON.stringify({
  network: 'Stable Studionet', chain_id: CHAIN_ID, rpc: RPC_URL,
  contract_address: address, deploy_tx: deployTx,
  explorer: 'https://explorer-studio.genlayer.com/address/' + address,
  source_sha256: sha(source), source_bytes: Buffer.byteLength(source),
  source_file: 'contracts/probe.py', byte_parity: 'BYTE_PARITY_MATCH: TRUE',
  wallets: {P1: account.address.toLowerCase()},
  note: 'Probe only. Not part of the product evidence pack.',
}, null, 2));
console.log('probe deployed:', address);
console.log('deploy tx:', deployTx);
console.log('wrote', OUT_PATH);
