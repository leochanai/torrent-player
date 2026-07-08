import type { MinimalWebTorrentFile, PlayableKind, TorrentFileItem } from '../webtorrent/types'

const VIDEO_EXTENSIONS = new Set([
  '3g2',
  '3gp',
  'm4v',
  'mkv',
  'mov',
  'mp4',
  'ogm',
  'ogv',
  'webm',
])

const AUDIO_EXTENSIONS = new Set([
  'aac',
  'flac',
  'm4a',
  'mp3',
  'oga',
  'ogg',
  'opus',
  'wav',
  'weba',
])

const UNSUPPORTED_CONTAINER_EXTENSIONS = new Set(['avi', 'm2ts', 'mpeg', 'mpg', 'ts', 'wmv'])

export function toTorrentFileItem(
  file: MinimalWebTorrentFile,
  selectedPath?: string,
): TorrentFileItem {
  const media = classifyMediaFile(file.name, file.type)

  return {
    path: file.path,
    name: file.name,
    size: file.length || file.size || 0,
    mimeType: file.type || 'application/octet-stream',
    downloaded: file.downloaded || 0,
    progress: Number.isFinite(file.progress) ? file.progress : 0,
    playableKind: media.kind,
    codecHint: media.codecHint,
    selected: file.path === selectedPath,
  }
}

export function classifyMediaFile(
  name: string,
  mimeType = '',
): { kind: PlayableKind; codecHint?: string } {
  const extension = getFileExtension(name)
  const lowerType = mimeType.toLowerCase()

  if (UNSUPPORTED_CONTAINER_EXTENSIONS.has(extension)) {
    return {
      kind: 'unsupported',
      codecHint: '该容器通常不能被浏览器原生播放器直接解码。',
    }
  }

  if (lowerType.startsWith('video/') || VIDEO_EXTENSIONS.has(extension)) {
    return {
      kind: 'video',
      codecHint: browserSupportHint(extension),
    }
  }

  if (lowerType.startsWith('audio/') || AUDIO_EXTENSIONS.has(extension)) {
    return {
      kind: 'audio',
      codecHint: browserSupportHint(extension),
    }
  }

  return { kind: 'unknown' }
}

export function chooseDefaultPlayableFile(files: TorrentFileItem[]): TorrentFileItem | undefined {
  return files.find((file) => file.playableKind === 'video') ?? files.find((file) => file.playableKind === 'audio')
}

export function canRenderInMediaElement(file: TorrentFileItem): file is TorrentFileItem & {
  playableKind: 'video' | 'audio'
} {
  return file.playableKind === 'video' || file.playableKind === 'audio'
}

function getFileExtension(name: string): string {
  const dotIndex = name.lastIndexOf('.')
  return dotIndex >= 0 ? name.slice(dotIndex + 1).toLowerCase() : ''
}

function browserSupportHint(extension: string): string | undefined {
  if (extension === 'mkv') {
    return 'MKV 是否可播取决于浏览器和内部编码；失败时请换 MP4/WebM。'
  }
  if (extension === 'mov' || extension === 'm4v') {
    return '该容器通常可打开，但仍取决于视频/音频编码。'
  }
  return undefined
}
