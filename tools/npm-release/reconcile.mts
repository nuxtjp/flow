// SPDX-License-Identifier: Apache-2.0; see NOTICE in this directory.
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { appendFileSync, readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { record, parseNotice } from './notice.mts'
import { read, verifyPublication } from './publication.mts'
const repository = 'nuxtjp/flow'
if (process.env.GITHUB_REPOSITORY !== repository) throw Error('Owner mismatch')
const contract = record(JSON.parse(readFileSync('.github/npm-release.json', 'utf8')))
if (contract.repository !== repository || contract.package !== '@nuxtjp/flow') throw Error('Release contract mismatch')
const api = (path: string): unknown => JSON.parse(execFileSync('gh', ['api', `repos/${repository}${path ? '/' + path : ''}`], { encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 ** 2 }))
const owner = record(api(''))
if (owner.private !== false || owner.archived || owner.full_name !== repository) throw Error('Active public owner required')
const npmRoot = execFileSync('npm', ['root', '--global'], { encoding: 'utf8', timeout: 30000 }).trim()
const vendor = createRequire(join(npmRoot, 'npm/package.json'))
if (record(vendor('./package.json')).version !== '12.2.0') throw Error('Reviewed npm verifier required')
interface Sigstore { verify: (bundle: unknown, options: Record<string, unknown>) => Promise<void> }
function isVerifier(value: unknown): value is Sigstore { return typeof record(value).verify === 'function' }
const sigstore: unknown = vendor('sigstore')
if (!isVerifier(sigstore)) throw Error('Vendor verifier unavailable')
const issues = api('issues?state=open&per_page=100')
if (!Array.isArray(issues)) throw Error('Issue list required')
const result = { checked: 0, verified: 0, closed: 0, retained: 0, partial: issues.length === 100 }
for (const value of issues) {
  const row = record(value)
  if (typeof row.title !== 'string' || !row.title.startsWith('[npm stage] Review ')) continue
  if (result.checked >= 20) { result.partial = true; break }
  result.checked++
  try {
    const notice = parseNotice(row); const run = record(api(`actions/runs/${notice.run}`))
    if (run.path !== '.github/workflows/publish-npm.yml' || run.head_sha !== notice.source || run.head_branch !== `v${notice.version}` || run.event !== 'push' || run.status !== 'completed' || run.conclusion !== 'success') throw Error('Accepted release run required')
    const cache = mkdtempSync(join(process.env.RUNNER_TEMP ?? tmpdir(), 'flow-signatures-'))
    try { await verifyPublication(notice, read, async (bundle, identity) => {
      await sigstore.verify(bundle, { certificateIdentityURI: identity, certificateIssuer: 'https://token.actions.githubusercontent.com', timeout: 15000, retry: 0, tlogThreshold: 1, ctLogThreshold: 1, tufCachePath: cache })
    }) } finally { rmSync(cache, { recursive: true, force: true }) }
    if (!Number.isSafeInteger(row.number) || Number(row.number) < 1) throw Error('Issue number required')
    const path = `issues/${row.number}`; const fresh = record(api(path)); parseNotice(fresh)
    if (fresh.body !== row.body || fresh.title !== row.title) throw Error('Notice changed during verification')
    result.verified++
    if (process.argv.includes('--observe-only')) continue
    execFileSync('gh', ['api', '--method', 'PATCH', `repos/${repository}${path ? '/' + path : ''}`, '-f', 'state=closed', '-f', 'state_reason=completed'], { timeout: 30000, stdio: 'pipe' })
    if (record(api(path)).state !== 'closed') throw Error('Close not confirmed')
    result.closed++
  } catch { result.retained++ }
}
console.log(JSON.stringify(result))
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Published npm notices\n\n${JSON.stringify(result)}\n\nOnly exact public bytes, source/run binding and vendor-verified signatures permit closure. Pending or uncertain notices remain open. No package is published or approved here.\n`)
