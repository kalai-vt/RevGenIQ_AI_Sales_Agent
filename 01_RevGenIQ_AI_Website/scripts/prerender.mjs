// Runs after `vite build` + `vite build --ssr` (see package.json) to bake
// static, crawlable HTML into every route. See src/entry-server.tsx for why.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const ROUTES = [
  '/', '/products', '/sales-iq', '/bill-iq',
  '/pricing', '/about', '/blog', '/careers', '/press', '/contact',
  '/changelog', '/roadmap', '/status', '/docs', '/community', '/tutorials',
  '/templates', '/privacy', '/terms', '/security', '/gdpr', '/cookies',
]

const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href)
const template = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf-8')

for (const url of ROUTES) {
  let appHtml
  try {
    appHtml = render(url)
  } catch (err) {
    console.error(`[prerender] FAILED for ${url}:`, err.message)
    continue
  }
  const html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
  const outPath = url === '/' ? path.join(root, 'dist', 'index.html') : path.join(root, 'dist', url.slice(1), 'index.html')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, html)
  console.log(`[prerender] ${url} -> ${path.relative(root, outPath)} (${appHtml.length} bytes of markup)`)
}
