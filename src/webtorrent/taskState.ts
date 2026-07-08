import type { AppError, TaskStatus, TorrentTask } from './types'
import { emptyTorrentTask } from './types'

export type TorrentTaskEvent =
  | { type: 'validate'; sourceKind: 'magnet' | 'torrent-file'; label: string }
  | { type: 'metadata'; id: string; infoHash?: string; name?: string }
  | { type: 'stats'; partial: Partial<TorrentTask> }
  | { type: 'no-peers'; detail?: string }
  | { type: 'status'; status: TaskStatus }
  | { type: 'error'; error: AppError }
  | { type: 'stopped' }

export function reduceTorrentTask(
  task: TorrentTask = emptyTorrentTask,
  event: TorrentTaskEvent,
): TorrentTask {
  switch (event.type) {
    case 'validate':
      return {
        ...emptyTorrentTask,
        id: `pending-${Date.now()}`,
        name: event.label,
        sourceKind: event.sourceKind,
        status: 'validating',
      }
    case 'metadata':
      return {
        ...task,
        id: event.id,
        infoHash: event.infoHash,
        name: event.name ?? task.name,
        status: 'ready',
        error: undefined,
      }
    case 'stats': {
      const hasPeerOrTraffic =
        (event.partial.numPeers ?? task.numPeers) > 0 ||
        (event.partial.downloadSpeed ?? task.downloadSpeed) > 0 ||
        (event.partial.downloadedBytes ?? task.downloadedBytes) > task.downloadedBytes ||
        (event.partial.progress ?? task.progress) > task.progress
      const recoveredFromNoPeers = task.error?.code === 'no-peers' && hasPeerOrTraffic

      return {
        ...task,
        ...event.partial,
        status: recoveredFromNoPeers && task.status === 'no-peers' ? 'ready' : (event.partial.status ?? task.status),
        error: recoveredFromNoPeers ? undefined : (event.partial.error ?? task.error),
      }
    }
    case 'no-peers':
      return {
        ...task,
        status: task.status === 'playing' || task.status === 'paused' ? task.status : 'no-peers',
        error: {
          code: 'no-peers',
          message: '暂时没有可用 peers。',
          technicalDetail: event.detail,
          recoveryAction: '继续等待，或确认 magnet / tracker 中包含 WebRTC peers 或 Web Seed。',
        },
      }
    case 'status':
      return {
        ...task,
        status: event.status,
      }
    case 'error':
      return {
        ...task,
        status: 'error',
        error: event.error,
      }
    case 'stopped':
      return {
        ...task,
        status: 'stopped',
        downloadSpeed: 0,
        uploadSpeed: 0,
        numPeers: 0,
      }
  }
}
