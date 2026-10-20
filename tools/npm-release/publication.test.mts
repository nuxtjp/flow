// SPDX-License-Identifier: Apache-2.0; see NOTICE in this directory.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { parseNotice, type Notice } from './notice.mts'
import { verifyPublication, read } from './publication.mts'
const notice: Notice = { stage: '11111111-2222-3333-4444-555555555555', version: '0.1.1', source: 'a'.repeat(40), run: '123', sha256: createHash('sha256').update('archive').digest('hex') }
const issue = () => ({ title: `[npm stage] Review ${notice.stage}`, state: 'open', user: { login: 'github-actions[bot]' },
  body: `Package: @nuxtjp/flow@${notice.version}\nStage: ${notice.stage}\nSHA256: ${notice.sha256}\nSource: ${notice.source}\nCI: https://github.com/nuxtjp/flow/actions/runs/123\n` })
function fixture() {
  const archive = Buffer.from('archive'); const sha512 = createHash('sha512').update(archive).digest()
  const metadata = { name: '@nuxtjp/flow', version: notice.version, dist: { tarball: 'https://registry.npmjs.org/@nuxtjp/flow/-/flow-0.1.1.tgz', integrity: `sha512-${sha512.toString('base64')}` } }
  const statement = { _type: 'https://in-toto.io/Statement/v1', predicateType: 'https://slsa.dev/provenance/v1',
    subject: [{ name: 'pkg:npm/%40nuxtjp/flow@0.1.1', digest: { sha512: sha512.toString('hex') } }],
    predicate: { buildDefinition: { buildType: 'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1',
      externalParameters: { workflow: { repository: 'https://github.com/nuxtjp/flow', path: '.github/workflows/publish-npm.yml', ref: 'refs/tags/v0.1.1' } },
      resolvedDependencies: [{ uri: 'git+https://github.com/nuxtjp/flow@refs/tags/v0.1.1', digest: { gitCommit: notice.source } }], internalParameters: { github: { event_name: 'push' } } },
      runDetails: { metadata: { invocationId: 'https://github.com/nuxtjp/flow/actions/runs/123/attempts/1' } } } }
  const reader = async (url: string) => {
    if (url.endsWith('/0.1.1')) return Buffer.from(JSON.stringify(metadata))
    if (url.endsWith('.tgz')) return archive
    return Buffer.from(JSON.stringify({ attestations: [{ predicateType: statement.predicateType, bundle: { dsseEnvelope: { payloadType: 'application/vnd.in-toto+json', payload: Buffer.from(JSON.stringify(statement)).toString('base64') } } }] }))
  }
  return { metadata, statement, reader }
}
test('an exact owner bot notice binds package, stage, source and source run', () => assert.deepEqual(parseNotice(issue()), notice))
test('human, closed, PR, ambiguous and cross-owner notices cannot be closed', () => {
  for (const change of [{ user: { login: 'human' } }, { state: 'closed' }, { pull_request: {} },
    { body: issue().body + `Source: ${notice.source}\n` }, { body: issue().body.replace('nuxtjp/flow/actions', 'other/owner/actions') },
    { body: issue().body.replace('@nuxtjp/flow@', '@other/flow@') }, { title: '[npm stage] Review wrong' }]) assert.throws(() => parseNotice({ ...issue(), ...change }))
})
test('only exact public bytes and bound provenance reach the vendor signature verifier', async () => {
  let calls = 0
  await verifyPublication(notice, fixture().reader, async (_bundle, identity) => { calls++; assert.equal(identity, 'https://github.com/nuxtjp/flow/.github/workflows/publish-npm.yml@refs/tags/v0.1.1') })
  assert.equal(calls, 1)
})
test('vendor signature verification failure remains a failure', async () => {
  await assert.rejects(verifyPublication(notice, fixture().reader, async () => { throw Error('signature rejected') }), /signature rejected/)
})
test('changed archives, unavailable versions and foreign archive origins are rejected', async () => {
  await assert.rejects(verifyPublication({ ...notice, sha256: '0'.repeat(64) }, fixture().reader, async () => {}))
  await assert.rejects(verifyPublication(notice, async () => { throw Error('not published') }, async () => {}))
  const f = fixture(); f.metadata.dist.tarball = 'https://untrusted.invalid/archive.tgz'
  await assert.rejects(verifyPublication(notice, f.reader, async () => {}))
})
test('substituted source, subject, workflow, event and run cannot pass provenance binding', async () => {
  const mutations = [
    (f: ReturnType<typeof fixture>) => { f.statement.subject[0]!.digest.sha512 = '0'.repeat(128) },
    (f: ReturnType<typeof fixture>) => { f.statement.predicate.buildDefinition.resolvedDependencies[0]!.digest.gitCommit = 'b'.repeat(40) },
    (f: ReturnType<typeof fixture>) => { f.statement.predicate.buildDefinition.externalParameters.workflow.repository = 'https://github.com/other/owner' },
    (f: ReturnType<typeof fixture>) => { f.statement.predicate.buildDefinition.externalParameters.workflow.ref = 'refs/heads/main' },
    (f: ReturnType<typeof fixture>) => { f.statement.predicate.buildDefinition.internalParameters.github.event_name = 'pull_request_target' },
    (f: ReturnType<typeof fixture>) => { f.statement.predicate.runDetails.metadata.invocationId = 'https://github.com/other/owner/actions/runs/123/attempts/1' },
  ]
  for (const mutate of mutations) { const f = fixture(); mutate(f); let reached = false; await assert.rejects(verifyPublication(notice, f.reader, async () => { reached = true })); assert.equal(reached, false) }
})
test('streamed public evidence has a deadline, no redirects and a byte limit', async () => {
  const original = globalThis.fetch
  try {
    globalThis.fetch = async (_url, init) => { assert.equal(init?.redirect, 'error'); assert.ok(init?.signal); return new Response('oversized') }
    await assert.rejects(read('https://registry.npmjs.org/test', 3), /limit/)
    globalThis.fetch = async () => new Response('missing', { status: 404 })
    await assert.rejects(read('https://registry.npmjs.org/test', 100), /unavailable/)
  } finally { globalThis.fetch = original }
})
