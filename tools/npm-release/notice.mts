// SPDX-License-Identifier: Apache-2.0; see NOTICE in this directory.
export interface Notice { stage: string; version: string; sha256: string; source: string; run: string }
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
export function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw Error('Object required')
  return value
}
export function parseNotice(value: unknown): Notice {
  const issue = record(value)
  if (record(issue.user).login !== 'github-actions[bot]' || issue.state !== 'open' || issue.pull_request) throw Error('Open owner bot notice required')
  const uuid = '[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}'
  if (typeof issue.title !== 'string' || !new RegExp(`^\\[npm stage\\] Review ${uuid}$`).test(issue.title)) throw Error('Exact stage title required')
  if (typeof issue.body !== 'string' || issue.body.length > 16384) throw Error('Bounded notice required')
  const body = issue.body
  const field = (name: string, pattern: string): string => {
    const matches = [...body.matchAll(new RegExp(`^${name}: (${pattern})$`, 'gm'))]
    if (matches.length !== 1 || !matches[0]?.[1]) throw Error('Unique notice field required')
    return matches[0][1]
  }
  const version = field('Package', '@nuxtjp/flow@(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)').slice('@nuxtjp/flow@'.length)
  const stage = field('Stage', uuid)
  if (issue.title !== `[npm stage] Review ${stage}`) throw Error('Stage title/body mismatch')
  return { stage, version, sha256: field('SHA256', '[a-f0-9]{64}'), source: field('Source', '[a-f0-9]{40}'),
    run: field('CI', 'https://github\\.com/nuxtjp/flow/actions/runs/[1-9][0-9]*').split('/').at(-1) ?? '' }
}
