import { readFileSync, writeFileSync, appendFileSync, statSync } from 'node:fs'
import { bindPack, bindStage, parseReceipt } from './binding.mts'
function json(path: string): unknown {
  if (statSync(path).size > 1024 * 1024) throw Error('Bounded JSON required')
  const value: unknown = JSON.parse(readFileSync(path, 'utf8'))
  return value
}
const mode = process.argv[2]
const folder = process.argv[3]
if (!folder || process.argv.length !== 4 || !['pack', 'stage'].includes(mode ?? '')) throw Error('Usage: archive.mts pack|stage directory')
if (mode === 'pack') {
  const manifest = json('package.json')
  if (typeof manifest !== 'object' || manifest === null || !('version' in manifest) || typeof manifest.version !== 'string') throw Error('Package version required')
  const filename = `nuxtjp-flow-${manifest.version}.tgz`
  if (!/^nuxtjp-flow-[0-9]+\.[0-9]+\.[0-9]+\.tgz$/.test(filename)) throw Error('Invalid archive name')
  const path = `${folder}/${filename}`
  if (statSync(path).size > 16 * 1024 * 1024) throw Error('Archive too large')
  const receipt = bindPack(json(`${folder}/pack.json`), readFileSync(path), process.env.GITHUB_SHA ?? '', manifest.version)
  writeFileSync(`${folder}/receipt.json`, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' })
  appendFileSync(process.env.GITHUB_OUTPUT ?? '/dev/null', `filename=${receipt.filename}\nsha256=${receipt.sha256}\n`)
} else {
  const receipt = parseReceipt(json(`${folder}/receipt.json`))
  const { id, notice } = bindStage(receipt, json(`${folder}/stage.json`), process.env.GITHUB_RUN_ID ?? '')
  writeFileSync(`${folder}/notice.md`, notice, { flag: 'wx' })
  appendFileSync(process.env.GITHUB_OUTPUT ?? '/dev/null', `stage-id=${id}\n`)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY ?? '/dev/null', notice)
}
