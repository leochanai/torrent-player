import type { TaskStatus } from '../webtorrent/types'

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  idle: '空闲',
  validating: '正在校验',
  'fetching-metadata': '正在获取元数据',
  ready: '准备就绪',
  buffering: '正在缓冲',
  playing: '正在播放',
  paused: '已暂停',
  'no-peers': '等待连接节点',
  unsupported: '当前环境不支持',
  error: '发生错误',
  stopped: '已停止',
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  )
  const value = bytes / 1024 ** exponent

  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${BYTE_UNITS[exponent]}`
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%'
  return `${Math.max(0, Math.min(100, value * 100)).toFixed(value > 0 && value < 0.1 ? 1 : 0)}%`
}

export function formatRatio(value: number): string {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:00'

  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function formatTaskStatus(status: TaskStatus): string {
  return TASK_STATUS_LABELS[status]
}
