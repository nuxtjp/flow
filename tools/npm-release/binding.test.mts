import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { bindPack, bindStage, parseReceipt } from './binding.mts'
const bytes = Buffer.from('synthetic tar bytes')
const pack = { name: '@nuxtjp/flow', version: '0.1.0', filename: 'nuxtjp-flow-0.1.0.tgz',
  integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
  files: ['package.json', 'LICENSE', 'dist/module.mjs'].map(path => ({ path })) }
const source = 'a'.repeat(40)
const receipt = bindPack([pack], bytes, source, '0.1.0')
const stage = { name: pack.name, version: pack.version, integrity: pack.integrity, stageId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }
test('pack binds exact bytes and source; stage can only produce a submitted review note', () => {
  assert.deepEqual(bindPack({ [pack.name]: pack }, bytes, source, '0.1.0'), receipt)
  assert.equal(receipt.sha256, createHash('sha256').update(bytes).digest('hex'))
  for (const value of [stage, [stage], { [pack.name]: stage }]) {
    const note = bindStage(receipt, value, '123')
    assert.equal(note.id, stage.stageId)
    assert.match(note.notice, /submitted/)
  }
})
for (const [name, value] of Object.entries({ wrongName: { ...pack, name: '@other/flow' }, wrongVersion: { ...pack, version: '0.2.0' },
  wrongFile: { ...pack, filename: '../evil.tgz' }, wrongIntegrity: { ...pack, integrity: 'sha512-invalid' },
  traversal: { ...pack, files: [...pack.files, { path: 'docs/../private' }] },
  privatePath: { ...pack, files: [...pack.files, { path: '.local/secret' }] },
  duplicate: { ...pack, files: [...pack.files, pack.files[0]] }, missingLicense: { ...pack, files: pack.files.filter(x => x.path !== 'LICENSE') } })) {
  test(`pack refuses ${name}`, () => assert.throws(() => bindPack([value], bytes, source, '0.1.0')))
}
test('pack refuses wrong bytes, source and multiple archives', () => {
  assert.throws(() => bindPack([pack], Buffer.from('changed'), source, '0.1.0'))
  assert.throws(() => bindPack([pack], bytes, 'invalid', '0.1.0'))
  assert.throws(() => bindPack([pack, pack], bytes, source, '0.1.0'))
})
for (const [name, value] of Object.entries({ wrongId: { ...stage, stageId: 'placeholder' }, wrongVersion: { ...stage, version: '1.0.0' },
  wrongIntegrity: { ...stage, integrity: 'sha512-other' }, multiple: [stage, stage] })) {
  test(`stage refuses ${name}`, () => assert.throws(() => bindStage(receipt, value, '123')))
}
test('stage rejects malformed receipts and run identity', () => {
  for (const value of [null, {}, { ...receipt, source: 'invalid' }, { ...receipt, filename: '../archive' }, { ...receipt, integrity: 'invalid' }]) {
    assert.throws(() => parseReceipt(value))
  }
  assert.throws(() => bindStage(receipt, stage, 'invalid'))
})
