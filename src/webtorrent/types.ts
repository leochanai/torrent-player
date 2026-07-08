export type SourceKind = 'magnet' | 'torrent-file'

export type TaskStatus =
  | 'idle'
  | 'validating'
  | 'fetching-metadata'
  | 'ready'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'no-peers'
  | 'unsupported'
  | 'error'
  | 'stopped'

export type AppErrorCode =
  | 'invalid-source'
  | 'webrtc-unsupported'
  | 'service-worker-failed'
  | 'metadata-timeout'
  | 'no-peers'
  | 'no-playable-files'
  | 'codec-unsupported'
  | 'webtorrent-error'
  | 'playback-error'

export type PlayableKind = 'video' | 'audio' | 'unknown' | 'unsupported'

export type AppError = {
  code: AppErrorCode
  message: string
  technicalDetail?: string
  recoveryAction: string
}

export type CapabilityState = {
  webRtcSupported: boolean
  serviceWorkerSupported: boolean
  streamServerReady: boolean
  codecHint: string
}

export type TorrentSource = {
  kind: SourceKind
  inputLabel: string
  rawValue: string
  addedAt: number
  validationStatus: 'valid' | 'invalid'
}

export type TorrentFileItem = {
  path: string
  name: string
  size: number
  mimeType: string
  downloaded: number
  progress: number
  playableKind: PlayableKind
  selected: boolean
  codecHint?: string
}

export type TorrentTask = {
  id: string
  infoHash?: string
  name?: string
  sourceKind?: SourceKind
  status: TaskStatus
  progress: number
  downloadedBytes: number
  uploadedBytes: number
  downloadSpeed: number
  uploadSpeed: number
  numPeers: number
  ratio: number
  error?: AppError
}

export type PlaybackState = {
  filePath?: string
  fileName?: string
  mediaKind?: 'video' | 'audio'
  status: 'idle' | 'ready' | 'buffering' | 'playing' | 'paused' | 'error'
  currentTime: number
  duration: number
  buffering: boolean
  error?: AppError
}

export type ActivityEvent = {
  id: string
  at: number
  tone: 'info' | 'success' | 'warning' | 'error'
  label: string
  detail?: string
}

export type TorrentInput =
  | {
      kind: 'magnet'
      value: string
      label: string
    }
  | {
      kind: 'torrent-file'
      value: Uint8Array
      label: string
    }

export type MinimalWebTorrentFile = {
  name: string
  path: string
  length: number
  size: number
  type: string
  downloaded: number
  progress: number
  streamURL: string
  select: (priority?: number) => void
  deselect: () => void
  streamTo: (element: HTMLMediaElement) => HTMLMediaElement
}

export type MinimalWebTorrent = {
  infoHash?: string
  magnetURI?: string
  name?: string
  files: MinimalWebTorrentFile[]
  progress: number
  downloaded: number
  uploaded: number
  downloadSpeed: number
  uploadSpeed: number
  numPeers: number
  ratio: number
  ready: boolean
  done: boolean
  on: (event: string, handler: (...args: unknown[]) => void) => MinimalWebTorrent
  once: (event: string, handler: (...args: unknown[]) => void) => MinimalWebTorrent
  destroy: (
    opts?: { destroyStore?: boolean },
    callback?: (error?: Error | null) => void,
  ) => void
}

export type MinimalWebTorrentClient = {
  downloadSpeed: number
  uploadSpeed: number
  progress: number
  ratio: number
  torrents: MinimalWebTorrent[]
  add: (
    torrentId: string | Uint8Array,
    opts?: Record<string, unknown>,
    onTorrent?: (torrent: MinimalWebTorrent) => void,
  ) => MinimalWebTorrent
  createServer: (
    opts: { controller: ServiceWorkerRegistration },
    force?: 'browser' | 'node',
  ) => { close?: () => void }
  on: (event: string, handler: (...args: unknown[]) => void) => MinimalWebTorrentClient
  destroy: (callback?: (error?: Error | null) => void) => void
  _server?: { close?: () => void }
}

export type WebTorrentGlobal = {
  WEBRTC_SUPPORT: boolean
  new (opts?: Record<string, unknown>): MinimalWebTorrentClient
}

export type TorrentRuntime = {
  client: MinimalWebTorrentClient
  close: () => Promise<void>
}

export const emptyCapabilityState: CapabilityState = {
  webRtcSupported: false,
  serviceWorkerSupported: false,
  streamServerReady: false,
  codecHint: '浏览器能力尚未检测。',
}

export const emptyTorrentTask: TorrentTask = {
  id: 'idle',
  status: 'idle',
  progress: 0,
  downloadedBytes: 0,
  uploadedBytes: 0,
  downloadSpeed: 0,
  uploadSpeed: 0,
  numPeers: 0,
  ratio: 0,
}

export const emptyPlaybackState: PlaybackState = {
  status: 'idle',
  currentTime: 0,
  duration: 0,
  buffering: false,
}
