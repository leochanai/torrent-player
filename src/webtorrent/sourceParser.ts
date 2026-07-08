import type { AppError, TorrentInput } from './types'

const MAX_MAGNET_LENGTH = 32768
const MAX_TORRENT_FILE_BYTES = 50 * 1024 * 1024
const BTIH_PATTERN = /^(?:[a-f0-9]{40}|[a-z2-7]{32})$/i
const BTMH_PATTERN = /^[a-z0-9]+$/i

export type MagnetParseResult =
  | { ok: true; value: string; label: string; displayName?: string }
  | { ok: false; error: AppError }

export function parseMagnetInput(input: string): MagnetParseResult {
  const value = input.trim()

  if (!value) {
    return invalidSource('请输入 magnet URI。', '粘贴以 magnet:? 开头的链接。')
  }

  if (value.length > MAX_MAGNET_LENGTH) {
    return invalidSource('magnet URI 过长。', '确认输入不是整段网页或其它无关文本。')
  }

  if (!value.toLowerCase().startsWith('magnet:?')) {
    return invalidSource('这不是 magnet URI。', '请输入以 magnet:? 开头的链接，或导入 .torrent 文件。')
  }

  let params: URLSearchParams
  try {
    params = new URL(value).searchParams
  } catch {
    return invalidSource('magnet URI 格式无法解析。', '检查链接是否被截断或包含未转义字符。')
  }

  const xtValues = params.getAll('xt')
  const hasSupportedHash = xtValues.some((xt) => {
    const normalized = xt.toLowerCase()
    if (normalized.startsWith('urn:btih:')) {
      return BTIH_PATTERN.test(xt.slice('urn:btih:'.length))
    }
    if (normalized.startsWith('urn:btmh:')) {
      return BTMH_PATTERN.test(xt.slice('urn:btmh:'.length))
    }
    return false
  })

  if (!hasSupportedHash) {
    return invalidSource(
      'magnet URI 缺少可识别的 torrent hash。',
      '确认链接包含 xt=urn:btih: 或 xt=urn:btmh: 参数。',
    )
  }

  const displayName = params.get('dn') ?? undefined

  return {
    ok: true,
    value,
    label: displayName ? decodeSafe(displayName) : 'Magnet source',
    displayName,
  }
}

export async function readTorrentFile(file: File): Promise<TorrentInput> {
  if (!isTorrentFile(file)) {
    throw createInvalidTorrentFileError('请选择 .torrent 文件。')
  }

  if (file.size === 0) {
    throw createInvalidTorrentFileError('torrent 文件为空。')
  }

  if (file.size > MAX_TORRENT_FILE_BYTES) {
    throw createInvalidTorrentFileError('torrent 文件过大。')
  }

  return {
    kind: 'torrent-file',
    value: new Uint8Array(await readFileBytes(file)),
    label: file.name,
  }
}

export function magnetInputFromText(input: string): TorrentInput {
  const parsed = parseMagnetInput(input)
  if (!parsed.ok) {
    throw parsed.error
  }

  return {
    kind: 'magnet',
    value: parsed.value,
    label: parsed.label,
  }
}

export function isTorrentFile(file: File): boolean {
  const nameMatches = file.name.toLowerCase().endsWith('.torrent')
  const typeMatches =
    file.type === 'application/x-bittorrent' ||
    file.type === 'application/octet-stream' ||
    file.type === ''

  return nameMatches && typeMatches
}

function invalidSource(message: string, recoveryAction: string): MagnetParseResult {
  return {
    ok: false,
    error: {
      code: 'invalid-source',
      message,
      recoveryAction,
    },
  }
}

function createInvalidTorrentFileError(message: string): AppError {
  return {
    code: 'invalid-source',
    message,
    recoveryAction: '选择扩展名为 .torrent 的有效文件。',
  }
}

function decodeSafe(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

async function readFileBytes(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer()
  }

  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result)
        } else {
          reject(new Error('FileReader did not return an ArrayBuffer.'))
        }
      }
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'))
      reader.readAsArrayBuffer(file)
    })
  }

  return new Response(file).arrayBuffer()
}
