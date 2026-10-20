// SPDX-License-Identifier: Apache-2.0; see NOTICE in this directory.
import { createHash } from 'node:crypto'
import { record, type Notice } from './notice.mts'
export type Reader = (url: string, maximum: number) => Promise<Buffer>
export type Verify = (bundle: unknown, identity: string) => Promise<void>
const registry = 'https://registry.npmjs.org'
export const read: Reader = async (url, maximum) => {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) })
  if (!response.ok || !response.body) throw Error('Public evidence unavailable')
  const chunks: Uint8Array[] = []; let size = 0
  const stream = response.body.getReader()
  try {
    for (;;) {
      const chunk = await stream.read()
      if (chunk.done) break
      size += chunk.value.length
      if (size > maximum) throw Error('Public evidence exceeds limit')
      chunks.push(chunk.value)
    }
  } finally { await stream.cancel() }
  return Buffer.concat(chunks)
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw Error('Array required')
  return value
}
export async function verifyPublication(notice: Notice, reader: Reader, verify: Verify): Promise<void> {
  const metadata = record(JSON.parse((await reader(`${registry}/%40nuxtjp%2Fflow/${notice.version}`, 2 ** 21)).toString()))
  if (metadata.name !== '@nuxtjp/flow' || metadata.version !== notice.version || metadata.deprecated) throw Error('Registry identity mismatch')
  const dist = record(metadata.dist)
  const tarball = `${registry}/@nuxtjp/flow/-/flow-${notice.version}.tgz`
  if (dist.tarball !== tarball) throw Error('Official archive required')
  const archive = await reader(tarball, 2 ** 25)
  const sha512 = createHash('sha512').update(archive).digest()
  if (createHash('sha256').update(archive).digest('hex') !== notice.sha256 || dist.integrity !== `sha512-${sha512.toString('base64')}`) throw Error('Registry archive mismatch')
  const response = record(JSON.parse((await reader(`${registry}/-/npm/v1/attestations/%40nuxtjp%2Fflow@${notice.version}`, 2 ** 22)).toString()))
  const attestations = array(response.attestations).map(record).filter(a => a.predicateType === 'https://slsa.dev/provenance/v1')
  if (attestations.length !== 1) throw Error('One provenance required')
  const bundle = record(attestations[0]?.bundle)
  const envelope = record(bundle.dsseEnvelope)
  if (envelope.payloadType !== 'application/vnd.in-toto+json' || typeof envelope.payload !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(envelope.payload)) throw Error('Signed payload required')
  const statement = record(JSON.parse(Buffer.from(envelope.payload, 'base64').toString()))
  const subjects = array(statement.subject).map(record)
  if (statement._type !== 'https://in-toto.io/Statement/v1' || statement.predicateType !== 'https://slsa.dev/provenance/v1' || subjects.length !== 1 || subjects[0]?.name !== `pkg:npm/%40nuxtjp/flow@${notice.version}` || record(subjects[0]?.digest).sha512 !== sha512.toString('hex')) throw Error('Provenance subject mismatch')
  const predicate = record(statement.predicate); const build = record(predicate.buildDefinition)
  const workflow = record(record(build.externalParameters).workflow)
  const ref = `refs/tags/v${notice.version}`
  if (build.buildType !== 'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1' || workflow.repository !== 'https://github.com/nuxtjp/flow' || workflow.path !== '.github/workflows/publish-npm.yml' || workflow.ref !== ref) throw Error('Provenance workflow mismatch')
  const dependencies = array(build.resolvedDependencies).map(record)
  if (dependencies.length !== 1 || dependencies[0]?.uri !== `git+https://github.com/nuxtjp/flow@${ref}` || record(dependencies[0]?.digest).gitCommit !== notice.source) throw Error('Provenance source mismatch')
  const run = record(record(predicate.runDetails).metadata).invocationId
  if (typeof run !== 'string' || !new RegExp(`^https://github\\.com/nuxtjp/flow/actions/runs/${notice.run}/attempts/[1-9][0-9]*$`).test(run) || record(record(build.internalParameters).github).event_name !== 'push') throw Error('Provenance run mismatch')
  await verify(bundle, `https://github.com/nuxtjp/flow/.github/workflows/publish-npm.yml@${ref}`)
}
