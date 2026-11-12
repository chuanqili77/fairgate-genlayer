// Execute the shipped TypeScript receipt/history helpers with real SDK shapes.
// No RPC request or wallet signing is performed by this test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import ts from 'typescript';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(root, 'tests', '.tx-outcomes-'));
const storage = new Map();
globalThis.localStorage = {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)};
try {
  const source = fs.readFileSync(path.join(root, 'src/chain.ts'), 'utf8');
  const output = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext}}).outputText;
  const file = path.join(temporary, 'chain.mjs'); fs.writeFileSync(file, output);
  const {txGood, saveMyTx, loadMyTxs, leaderReturn} = await import(pathToFileURL(file).href);
  const receipt = (status, result, execution) => ({status, result, consensus_data: {leader_receipt: [{mode: 'leader', execution_result: execution}]}});
  assert.equal(txGood(receipt(7, 6, 'SUCCESS')), true);
  assert.equal(txGood(receipt('FINALIZED', 'MAJORITY_AGREE', 'SUCCESS')), true);
  assert.equal(txGood(receipt(7, 5, 'SUCCESS')), false, 'a successful leader on a disagreement is not a successful transaction');
  assert.equal(txGood(receipt(7, 6, 'ERROR')), false, 'a finalized agreed error is not success');
  assert.equal(txGood(receipt(6, 6, 'SUCCESS')), false, 'accepted is not finalized');
  assert.equal(txGood({status: 7, result: 6}), false, 'missing leader proof fails');
  saveMyTx('0x123', 'buy');
  assert.equal(loadMyTxs()[0].result, 'pending', 'a sent hash cannot be pre-labelled successful');
  saveMyTx('0x123', 'buy', 'disagreed');
  assert.equal(loadMyTxs()[0].result, 'disagreed');
  assert.equal(loadMyTxs().length, 1, 'receipt update preserves a single transaction record');
  saveMyTx('0x456', 'withdraw', 'error');
  assert.equal(loadMyTxs()[1].result, 'error');

  const loadReceipt = hash => JSON.parse(fs.readFileSync(path.join(root, 'evidence/receipts', hash + '.json'), 'utf8')).receipt;
  const held = leaderReturn(loadReceipt('0xff69bb3abf2a614055c1414aa3a446b5cf8931539aa41b1ef5dde56c45fbe97f'));
  assert.equal(held.verdict, 'EVENT_HELD');
  assert.deepEqual([held.changed, held.held_a, held.held_b], [true, true, true]);
  const closed = leaderReturn(loadReceipt('0x0d3922bd01b6bb92d313843acc55da98c5c2f44a01cc9ec5fb3a3968684d13e5'));
  assert.deepEqual([closed.changed, closed.verdict], [false, 'UNREACHABLE'], 'SUCCESS can carry an unchanged fail-closed business outcome');
  assert.equal(leaderReturn({}), null);
  console.log('ALL TRANSACTION OUTCOME TESTS PASS (14 assertions, no chain writes)');
} finally { fs.rmSync(temporary, {recursive: true, force: true}); }
