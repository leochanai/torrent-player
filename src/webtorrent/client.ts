import { registerStreamServiceWorker } from './serviceWorker'
import type {
  AppError,
  MinimalWebTorrentClient,
  TorrentRuntime,
  WebTorrentGlobal,
} from './types'

declare global {
  interface Window {
    WebTorrent?: WebTorrentGlobal
  }
}

const WEBTORRENT_LOADER_URL = '/vendor/webtorrent-loader.js'

let webTorrentLoader: Promise<WebTorrentGlobal> | undefined

export async function createTorrentRuntime(
  onClientError: (error: AppError) => void,
): Promise<TorrentRuntime> {
  const WebTorrent = await loadWebTorrent()

  if (!WebTorrent.WEBRTC_SUPPORT) {
    throw {
      code: 'webrtc-unsupported',
      message: '当前浏览器不支持 WebRTC。',
      recoveryAction: '请改用支持 WebRTC 的现代浏览器。',
    } satisfies AppError
  }

  const registration = await registerStreamServiceWorker()
  const client = new WebTorrent({
    maxConns: 55,
    tracker: true,
    webSeeds: true,
    dht: false,
    lsd: false,
    utPex: false,
  })

  client.on('error', (error) => {
    onClientError({
      code: 'webtorrent-error',
      message: 'WebTorrent client 遇到错误。',
      technicalDetail: messageFromUnknown(error),
      recoveryAction: '停止当前任务后重试；如果持续失败，请更换来源或浏览器。',
    })
  })

  client.createServer({ controller: registration }, 'browser')

  return {
    client,
    close: () => destroyClient(client),
  }
}

export function addTorrentToClient(
  client: MinimalWebTorrentClient,
  input: string | Uint8Array,
  onReady: (torrent: ReturnType<MinimalWebTorrentClient['add']>) => void,
): ReturnType<MinimalWebTorrentClient['add']> {
  return client.add(
    input,
    {
      destroyStoreOnDestroy: true,
      noPeersIntervalTime: 8,
      strategy: 'sequential',
    },
    onReady,
  )
}

export function messageFromUnknown(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

async function loadWebTorrent(): Promise<WebTorrentGlobal> {
  if (window.WebTorrent) return window.WebTorrent

  webTorrentLoader ??= loadWebTorrentFromScript().catch((error) => {
    webTorrentLoader = undefined
    throw error
  })

  return webTorrentLoader
}

function loadWebTorrentFromScript(): Promise<WebTorrentGlobal> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-webtorrent-loader="true"]`,
    )
    const script = existingScript ?? document.createElement('script')
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Timed out loading WebTorrent browser bundle.'))
    }, 12000)

    function cleanup(): void {
      window.clearTimeout(timeout)
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
      window.removeEventListener('webtorrent:ready', handleReady)
    }

    function handleReady(): void {
      handleLoad()
    }

    function handleLoad(): void {
      if (!window.WebTorrent) {
        cleanup()
        reject(new Error('WebTorrent loader did not expose window.WebTorrent.'))
        return
      }

      cleanup()
      resolve(window.WebTorrent)
    }

    function handleError(): void {
      cleanup()
      reject(new Error('Failed to load WebTorrent browser bundle.'))
    }

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
    window.addEventListener('webtorrent:ready', handleReady, { once: true })

    if (existingScript) return

    script.type = 'module'
    script.async = true
    script.src = WEBTORRENT_LOADER_URL
    script.dataset.webtorrentLoader = 'true'
    document.head.append(script)
  })
}

function destroyClient(client: MinimalWebTorrentClient): Promise<void> {
  return new Promise((resolve) => {
    try {
      client._server?.close?.()
    } catch {
      // The WebTorrent server can already be closed during unload.
    }

    client.destroy(() => resolve())
  })
}
