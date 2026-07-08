const RECENT_INPUTS_KEY = 'torrent-player.recent-inputs.v1'
const MAX_RECENT_INPUTS = 5

export type RecentInput = {
  label: string
  value: string
  savedAt: number
}

export function readRecentInputs(storage: Storage | undefined = safeStorage()): RecentInput[] {
  if (!storage) return []

  try {
    const parsed = JSON.parse(storage.getItem(RECENT_INPUTS_KEY) ?? '[]') as RecentInput[]
    return Array.isArray(parsed) ? parsed.filter(isRecentInput).slice(0, MAX_RECENT_INPUTS) : []
  } catch {
    return []
  }
}

export function rememberMagnetInput(
  input: RecentInput,
  storage: Storage | undefined = safeStorage(),
): RecentInput[] {
  if (!storage || !input.value.startsWith('magnet:?')) return readRecentInputs(storage)

  const current = readRecentInputs(storage)
  const next = [
    input,
    ...current.filter((item) => item.value !== input.value),
  ].slice(0, MAX_RECENT_INPUTS)

  storage.setItem(RECENT_INPUTS_KEY, JSON.stringify(next))
  return next
}

export function clearRecentInputs(storage: Storage | undefined = safeStorage()): void {
  storage?.removeItem(RECENT_INPUTS_KEY)
}

function safeStorage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

function isRecentInput(value: unknown): value is RecentInput {
  if (!value || typeof value !== 'object') return false
  const candidate = value as RecentInput
  return typeof candidate.label === 'string' &&
    typeof candidate.value === 'string' &&
    typeof candidate.savedAt === 'number'
}
