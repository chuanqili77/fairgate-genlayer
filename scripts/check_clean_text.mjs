// Public repository hygiene check: reject credential-shaped material.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirs = new Set(['node_modules', '.git', '__pycache__', 'dist', '.venv', '.cache']);
const findings = [];
// Detect operational notes in documentation without treating attribution or test instructions as violations.
const documentPatterns = [
  /^(?:\s*#{1,6}\s+|\s*[-*]\s+)?\s*(?:internal (?:handoff|deduplication|execution instructions|delivery status)|AI handoff|cross-account (?:handoff|instructions|deduplication)|内部排重|跨账号说明|AI\s*交接|内部执行指令|内部交付状态)\s*(?:[:：]|$)/i,
];
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,})\b/,
  /(?:PRIVATE_KEY|SECRET_ACCESS_KEY|API_SECRET)\s*[:=]\s*['"][^'"]{12,}['"]/i,
];
function inspect(file) {
  const data = fs.readFileSync(file, 'utf8');
  for (const [i, line] of data.split('\n').entries()) {
    if (patterns.some((pattern) => pattern.test(line)) ||
        (/\.md$/i.test(file) && documentPatterns.some((pattern) => pattern.test(line)))) {
      findings.push(path.relative(root, file) + ':' + (i + 1));
    }
  }
}
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir, {withFileTypes: true})) {
    if (ignoredDirs.has(item.name)) continue;
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (/\.(py|md|json|tsx|ts|mjs|js|html|css|ya?ml|toml)$/.test(item.name)) inspect(file);
  }
}
walk(root);
if (findings.length) {
  console.error('Repository hygiene check failed:', findings.join(', '));
  process.exit(1);
}
console.log('Repository hygiene check passed.');
