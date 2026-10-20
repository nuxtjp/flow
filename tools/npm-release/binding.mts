import { createHash } from 'node:crypto'
export interface Receipt { name: string; version: string; filename: string; sha256: string; integrity: string; source: string }
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const version = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/
export function bindPack(input: unknown, bytes: Uint8Array, source: string, expectedVersion: string): Receipt {
  if (record(input) && Object.keys(input).length === 1 && '@nuxtjp/flow' in input) input = [input['@nuxtjp/flow']]
  if (!Array.isArray(input) || input.length !== 1 || !record(input[0])) throw Error('One pack result required')
  const item = input[0]
  if (!version.test(expectedVersion) || item.name !== '@nuxtjp/flow' || item.version !== expectedVersion ||
      item.filename !== `nuxtjp-flow-${expectedVersion}.tgz` || !/^[a-f0-9]{40}$/.test(source)) throw Error('Pack identity mismatch')
  const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`
  if (item.integrity !== integrity || bytes.length === 0 || bytes.length > 16 * 1024 * 1024) throw Error('Pack integrity/size mismatch')
  if (!Array.isArray(item.files) || item.files.length < 3 || item.files.length > 512) throw Error('Bounded file list required')
  const paths = item.files.map((file: unknown) => {
    if (!record(file) || typeof file.path !== 'string') throw Error('File path required')
    const path = file.path
    if (path.split('/').some(part => part === '..' || part === '' || part.startsWith('.')) ||
        !/^(dist\/|docs\/|package\.json$|README(?:\.ja)?\.md$|LICENSE$|CONTRIBUTING\.md$|SECURITY\.md$)/.test(path)) throw Error('Unexpected packed path')
    return path
  })
  for (const path of ['package.json', 'LICENSE', 'dist/module.mjs']) if (!paths.includes(path)) throw Error('Required packed file missing')
  if (new Set(paths).size !== paths.length) throw Error('Duplicate packed path')
  return { name: '@nuxtjp/flow', version: expectedVersion, filename: `nuxtjp-flow-${expectedVersion}.tgz`,
    sha256: createHash('sha256').update(bytes).digest('hex'), integrity, source }
}
export function parseReceipt(value: unknown): Receipt {
  if (!record(value)) throw Error('Receipt object required')
  const string = (item: unknown): string => { if (typeof item !== 'string') throw Error('Receipt string required'); return item }
  const result = { name: string(value.name), version: string(value.version), filename: string(value.filename),
    sha256: string(value.sha256), integrity: string(value.integrity), source: string(value.source) }
  if (result.name !== '@nuxtjp/flow' || !version.test(result.version) || result.filename !== `nuxtjp-flow-${result.version}.tgz` ||
      !/^[a-f0-9]{64}$/.test(result.sha256) || !/^[a-f0-9]{40}$/.test(result.source) ||
      !/^sha512-[A-Za-z0-9+/]{86}==$/.test(result.integrity)) throw Error('Invalid receipt identity')
  return result
}
export function bindStage(receipt: Receipt, input: unknown, run: string): { id: string; notice: string } {
  receipt = parseReceipt(receipt)
  if (!/^[1-9][0-9]*$/.test(run) || receipt.name !== '@nuxtjp/flow' || !version.test(receipt.version) ||
      !/^[a-f0-9]{64}$/.test(receipt.sha256) || !/^[a-f0-9]{40}$/.test(receipt.source)) throw Error('Invalid receipt')
  let value: unknown = input
  if (Array.isArray(value) && value.length === 1) value = value[0]
  if (record(value) && Object.keys(value).length === 1 && receipt.name in value) value = value[receipt.name]
  if (!record(value) || value.name !== receipt.name || value.version !== receipt.version ||
      value.integrity !== receipt.integrity || typeof value.stageId !== 'string' ||
      !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value.stageId)) throw Error('Stage binding mismatch')
  return { id: value.stageId, notice: `# npm stage review\n\nPackage: ${receipt.name}@${receipt.version}\n\nStage: ${value.stageId}\n\nSHA256: ${receipt.sha256}\n\nSource: ${receipt.source}\n\nCI: https://github.com/nuxtjp/flow/actions/runs/${run}\n\nReview: https://www.npmjs.com/package/@nuxtjp/flow (Staged Packages)\n\nState: submitted; npm validation and owner 2FA approval remain required.\n` }
}
