import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, relative, resolve, sep } from 'node:path'

const mimeTypes: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon',
}

export async function serveStatic(directory: string) {
  const root = resolve(directory)
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
      let filename = resolve(root, `.${pathname}`)
      const path = relative(root, filename)
      if (path === '..' || path.startsWith(`..${sep}`)) throw new Error('Outside static root')
      if ((await stat(filename)).isDirectory()) filename = resolve(filename, 'index.html')
      response.setHeader('Content-Type', mimeTypes[extname(filename)] ?? 'application/octet-stream')
      response.end(await readFile(filename))
    }
    catch { response.writeHead(404).end('Not found') }
  })
  await new Promise<void>((done, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', done)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Static server has no TCP address')
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((done, reject) => {
      server.close(error => error ? reject(error) : done())
      server.closeAllConnections()
    }),
  }
}
