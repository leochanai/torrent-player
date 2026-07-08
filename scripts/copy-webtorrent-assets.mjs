import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const publicDir = join(root, 'public')
const vendorDir = join(publicDir, 'vendor')

mkdirSync(vendorDir, { recursive: true })

copyFileSync(
  join(root, 'node_modules/webtorrent/dist/sw.min.js'),
  join(publicDir, 'sw.min.js'),
)

copyFileSync(
  join(root, 'node_modules/webtorrent/dist/webtorrent.min.js'),
  join(vendorDir, 'webtorrent.min.js'),
)

writeFileSync(
  join(vendorDir, 'webtorrent-loader.js'),
  [
    "import WebTorrent from './webtorrent.min.js'",
    'window.WebTorrent = WebTorrent',
    "window.dispatchEvent(new CustomEvent('webtorrent:ready'))",
    '',
  ].join('\n'),
)
