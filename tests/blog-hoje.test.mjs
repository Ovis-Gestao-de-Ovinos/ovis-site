import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/blog-hoje.mjs', import.meta.url));
// Roda o CLI contra um blog/_rotina.json temporário.
const rodar = (rotina, hoje) => {
  const dir = mkdtempSync(join(tmpdir(), 'blog-hoje-'));
  mkdirSync(join(dir, 'blog'));
  writeFileSync(join(dir, 'blog/_rotina.json'), rotina);
  return spawnSync('node', [script, '--hoje', hoje, '--raiz', dir], { encoding: 'utf8' });
};

test('blog-hoje: 0 e imprime a data quando publica', () => {
  const r = rodar('{ "modo": "automatico", "inicio": null }', '2026-10-27');
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), '2026-10-27');
});

test('blog-hoje: 2 quando hoje não publica', () => {
  assert.equal(rodar('{ "modo": "automatico", "inicio": "2026-10-27" }', '2026-11-11').status, 2);
});

test('blog-hoje: JSON quebrado é erro, não "não publica"', () => {
  const r = rodar('{ "modo": "automatico", }', '2026-10-27');
  assert.ok(![0, 2].includes(r.status), `status ${r.status}`);
});

test('blog-hoje: modo inválido é erro', () => {
  assert.ok(![0, 2].includes(rodar('{ "modo": "manual", "inicio": null }', '2026-10-27').status));
});
