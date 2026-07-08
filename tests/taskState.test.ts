import { describe, expect, it } from 'vitest'
import { reduceTorrentTask } from '../src/webtorrent/taskState'
import { emptyTorrentTask } from '../src/webtorrent/types'

describe('reduceTorrentTask', () => {
  it('enters validating state with source metadata', () => {
    const task = reduceTorrentTask(emptyTorrentTask, {
      type: 'validate',
      sourceKind: 'magnet',
      label: 'Sintel',
    })

    expect(task.status).toBe('validating')
    expect(task.name).toBe('Sintel')
    expect(task.sourceKind).toBe('magnet')
  })

  it('keeps stats and metadata separate from raw WebTorrent objects', () => {
    const ready = reduceTorrentTask(emptyTorrentTask, {
      type: 'metadata',
      id: 'abc',
      infoHash: 'abc',
      name: 'Demo',
    })
    const withStats = reduceTorrentTask(ready, {
      type: 'stats',
      partial: {
        downloadSpeed: 2048,
        numPeers: 3,
        progress: 0.25,
      },
    })

    expect(withStats).toMatchObject({
      id: 'abc',
      infoHash: 'abc',
      name: 'Demo',
      downloadSpeed: 2048,
      numPeers: 3,
      progress: 0.25,
    })
  })

  it('turns no peers into a recoverable user-facing error', () => {
    const task = reduceTorrentTask(emptyTorrentTask, {
      type: 'no-peers',
      detail: 'tracker',
    })

    expect(task.status).toBe('no-peers')
    expect(task.error).toMatchObject({
      code: 'no-peers',
      recoveryAction: expect.stringContaining('继续等待'),
    })
  })

  it('clears no peers after stats show peer traffic', () => {
    const noPeers = reduceTorrentTask(emptyTorrentTask, {
      type: 'no-peers',
      detail: 'tracker',
    })
    const recovered = reduceTorrentTask(noPeers, {
      type: 'stats',
      partial: {
        downloadedBytes: 1024,
        downloadSpeed: 512,
        numPeers: 1,
        progress: 0.01,
      },
    })

    expect(recovered.status).toBe('ready')
    expect(recovered.error).toBeUndefined()
  })
})
