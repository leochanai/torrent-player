import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { chooseDefaultPlayableFile, toTorrentFileItem } from '../lib/media'
import { readRecentInputs, rememberMagnetInput, type RecentInput } from '../lib/storage'
import { addTorrentToClient, createTorrentRuntime, messageFromUnknown } from '../webtorrent/client'
import { detectCapabilities } from '../webtorrent/serviceWorker'
import { magnetInputFromText, readTorrentFile } from '../webtorrent/sourceParser'
import { reduceTorrentTask } from '../webtorrent/taskState'
import {
  emptyCapabilityState,
  emptyPlaybackState,
  emptyTorrentTask,
  type ActivityEvent,
  type AppError,
  type CapabilityState,
  type MinimalWebTorrent,
  type MinimalWebTorrentClient,
  type MinimalWebTorrentFile,
  type PlaybackState,
  type TorrentFileItem,
  type TorrentInput,
  type TorrentRuntime,
  type TorrentTask,
} from '../webtorrent/types'

type PlayerState = {
  capabilities: CapabilityState
  task: TorrentTask
  files: TorrentFileItem[]
  playback: PlaybackState
  sourceLabel?: string
  activity: ActivityEvent[]
  recentInputs: RecentInput[]
  diagnosticOpen: boolean
}

const initialState: PlayerState = {
  capabilities: emptyCapabilityState,
  task: emptyTorrentTask,
  files: [],
  playback: emptyPlaybackState,
  activity: [],
  recentInputs: readRecentInputs(),
  diagnosticOpen: false,
}

export type TorrentPlayerController = PlayerState & {
  startMagnet: (value: string) => Promise<void>
  startTorrentFile: (file: File) => Promise<void>
  selectFile: (path: string) => void
  stop: () => Promise<void>
  clearError: () => void
  clearRecent: () => void
  setDiagnosticOpen: (open: boolean) => void
  bindMediaElement: (element: HTMLMediaElement | null) => void
  mediaHandlers: {
    onLoadStart: () => void
    onLoadedMetadata: () => void
    onWaiting: () => void
    onPlaying: () => void
    onPause: () => void
    onTimeUpdate: () => void
    onError: () => void
  }
}

export function useTorrentPlayer(): TorrentPlayerController {
  const [state, setState] = useState<PlayerState>(() => ({
    ...initialState,
    capabilities: detectCapabilities(),
  }))

  const runtimeRef = useRef<TorrentRuntime | null>(null)
  const torrentRef = useRef<MinimalWebTorrent | null>(null)
  const filesRef = useRef<Map<string, MinimalWebTorrentFile>>(new Map())
  const mediaElementRef = useRef<HTMLMediaElement | null>(null)
  const selectedPathRef = useRef<string | undefined>()
  const refreshTimerRef = useRef<number | undefined>()
  const metadataTimerRef = useRef<number | undefined>()

  const appendActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'at'>) => {
    setState((current) => ({
      ...current,
      activity: [
        {
          ...event,
          id: createEventId(),
          at: Date.now(),
        },
        ...current.activity,
      ].slice(0, 8),
    }))
  }, [])

  const refreshFromTorrent = useCallback(() => {
    const torrent = torrentRef.current
    if (!torrent) return

    const files = torrent.files.map((file) => toTorrentFileItem(file, selectedPathRef.current))
    filesRef.current = new Map(torrent.files.map((file) => [file.path, file]))

    setState((current) => ({
      ...current,
      task: reduceTorrentTask(current.task, {
        type: 'stats',
        partial: {
          id: torrent.infoHash ?? current.task.id,
          infoHash: torrent.infoHash,
          name: torrent.name ?? current.task.name,
          progress: torrent.progress,
          downloadedBytes: torrent.downloaded,
          uploadedBytes: torrent.uploaded,
          downloadSpeed: torrent.downloadSpeed,
          uploadSpeed: torrent.uploadSpeed,
          numPeers: torrent.numPeers,
          ratio: torrent.ratio,
        },
      }),
      files,
    }))
  }, [])

  const setFatalError = useCallback((error: AppError): void => {
    setState((current) => ({
      ...current,
      task: reduceTorrentTask(current.task, { type: 'error', error }),
      diagnosticOpen: true,
    }))
    appendActivity({
      tone: 'error',
      label: error.message,
      detail: error.technicalDetail,
    })
  }, [appendActivity])

  const setPlaybackError = useCallback((error: AppError): void => {
    setState((current) => ({
      ...current,
      task: reduceTorrentTask(current.task, { type: 'error', error }),
      playback: {
        ...current.playback,
        status: 'error',
        buffering: false,
        error,
      },
      diagnosticOpen: true,
    }))
    appendActivity({
      tone: 'error',
      label: error.message,
      detail: error.technicalDetail,
    })
  }, [appendActivity])

  const selectFile = useCallback((path: string) => {
    const file = filesRef.current.get(path)
    if (!file) return

    for (const candidate of filesRef.current.values()) {
      if (candidate.path !== path) candidate.deselect()
    }

    file.select(10)
    selectedPathRef.current = path

    const item = toTorrentFileItem(file, path)
    const mediaElement = mediaElementRef.current

    if (mediaElement && (item.playableKind === 'video' || item.playableKind === 'audio')) {
      try {
        file.streamTo(mediaElement)
        mediaElement.load()
      } catch (error) {
        setPlaybackError({
          code: 'playback-error',
          message: '无法为该文件创建流式播放地址。',
          technicalDetail: messageFromUnknown(error),
          recoveryAction: '确认 Service Worker 已注册，或停止任务后重试。',
        })
        return
      }
    }

    setState((current) => ({
      ...current,
      files: current.files.map((candidate) => ({
        ...candidate,
        selected: candidate.path === path,
      })),
      task: reduceTorrentTask(current.task, {
        type: 'status',
        status: 'buffering',
      }),
      playback: {
        ...emptyPlaybackState,
        filePath: file.path,
        fileName: file.name,
        mediaKind: item.playableKind === 'audio' ? 'audio' : 'video',
        status: 'ready',
        buffering: true,
      },
    }))

    appendActivity({
      tone: 'info',
      label: '已选择媒体文件',
      detail: file.name,
    })
  }, [appendActivity, setPlaybackError])

  const clearTimers = useCallback(() => {
    if (refreshTimerRef.current !== undefined) {
      window.clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = undefined
    }
    if (metadataTimerRef.current !== undefined) {
      window.clearTimeout(metadataTimerRef.current)
      metadataTimerRef.current = undefined
    }
  }, [])

  const stop = useCallback(async () => {
    clearTimers()
    selectedPathRef.current = undefined
    filesRef.current.clear()
    torrentRef.current = null

    const mediaElement = mediaElementRef.current
    if (mediaElement) {
      mediaElement.pause()
      mediaElement.removeAttribute('src')
      mediaElement.load()
    }

    const runtime = runtimeRef.current
    runtimeRef.current = null
    await runtime?.close()

    setState((current) => ({
      ...current,
      task: reduceTorrentTask(current.task, { type: 'stopped' }),
      files: [],
      playback: emptyPlaybackState,
      capabilities: {
        ...current.capabilities,
        streamServerReady: false,
      },
    }))

    appendActivity({
      tone: 'info',
      label: '任务已停止',
      detail: 'WebTorrent client 和临时流式资源已释放。',
    })
  }, [appendActivity, clearTimers])

  const attachTorrentEvents = useCallback((
    torrent: MinimalWebTorrent,
    client: MinimalWebTorrentClient,
    onDefaultFile: (path: string) => void,
  ): void => {
    const markReady = () => {
      if (metadataTimerRef.current !== undefined) {
        window.clearTimeout(metadataTimerRef.current)
        metadataTimerRef.current = undefined
      }

      const files = torrent.files.map((file) => toTorrentFileItem(file, selectedPathRef.current))
      filesRef.current = new Map(torrent.files.map((file) => [file.path, file]))
      const defaultFile = chooseDefaultPlayableFile(files)

      setState((current) => ({
        ...current,
        task: reduceTorrentTask(current.task, {
          type: 'metadata',
          id: torrent.infoHash ?? `torrent-${Date.now()}`,
          infoHash: torrent.infoHash,
          name: torrent.name,
        }),
        files,
      }))

      appendActivity({
        tone: 'success',
        label: 'metadata 已就绪',
        detail: `${torrent.name ?? 'Unnamed torrent'} · ${torrent.files.length} 个文件`,
      })

      if (defaultFile) {
        onDefaultFile(defaultFile.path)
      } else {
        setFatalError({
          code: 'no-playable-files',
          message: '该 torrent 中没有识别到可播放的音视频文件。',
          recoveryAction: '选择包含 MP4/WebM/MP3 等浏览器原生可播放文件的来源。',
        })
      }
    }

    torrent.once('ready', markReady)
    torrent.once('metadata', refreshFromTorrent)
    torrent.on('download', refreshFromTorrent)
    torrent.on('upload', refreshFromTorrent)
    torrent.on('done', () => {
      refreshFromTorrent()
      appendActivity({
        tone: 'success',
        label: '下载完成',
        detail: torrent.name,
      })
    })
    torrent.on('noPeers', (announceType) => {
      setState((current) => ({
        ...current,
        task: reduceTorrentTask(current.task, {
          type: 'no-peers',
          detail: typeof announceType === 'string' ? announceType : undefined,
        }),
      }))
      appendActivity({
        tone: 'warning',
        label: '暂未发现 peers',
        detail: typeof announceType === 'string' ? announceType : undefined,
      })
    })
    torrent.on('warning', (error) => {
      appendActivity({
        tone: 'warning',
        label: 'WebTorrent warning',
        detail: messageFromUnknown(error),
      })
    })
    torrent.on('error', (error) => {
      setFatalError({
        code: 'webtorrent-error',
        message: '当前 torrent 遇到错误。',
        technicalDetail: messageFromUnknown(error),
        recoveryAction: '停止当前任务后重试；如果持续失败，请更换来源。',
      })
    })

    if (client.torrents.includes(torrent)) {
      refreshFromTorrent()
    }
  }, [appendActivity, refreshFromTorrent, setFatalError])

  const addTorrent = useCallback((
    client: MinimalWebTorrentClient,
    input: TorrentInput,
  ): MinimalWebTorrent => {
    const torrent = addTorrentToClient(
      client,
      input.value,
      () => {
        refreshFromTorrent()
      },
    )

    appendActivity({
      tone: 'info',
      label: input.kind === 'magnet' ? '已添加 magnet' : '已添加 torrent 文件',
      detail: input.label,
    })

    return torrent
  }, [appendActivity, refreshFromTorrent])

  const startInput = useCallback(async (input: TorrentInput) => {
    await stop()

    const capabilities = detectCapabilities()
    setState((current) => ({
      ...current,
      capabilities,
      task: reduceTorrentTask(emptyTorrentTask, {
        type: 'validate',
        sourceKind: input.kind,
        label: input.label,
      }),
      sourceLabel: input.label,
      files: [],
      playback: emptyPlaybackState,
      diagnosticOpen: false,
    }))

    appendActivity({
      tone: 'info',
      label: '开始解析来源',
      detail: input.label,
    })

    if (!capabilities.webRtcSupported) {
      setFatalError({
        code: 'webrtc-unsupported',
        message: '当前浏览器不支持 WebRTC。',
        recoveryAction: '请改用支持 WebRTC 的现代浏览器。',
      })
      return
    }

    if (!capabilities.serviceWorkerSupported) {
      setFatalError({
        code: 'service-worker-failed',
        message: '当前浏览器不支持 Service Worker。',
        recoveryAction: '请使用 http://localhost 或 https 页面打开应用。',
      })
      return
    }

    try {
      const runtime = await createTorrentRuntime((error) => setFatalError(error))
      runtimeRef.current = runtime

      setState((current) => ({
        ...current,
        capabilities: {
          ...current.capabilities,
          streamServerReady: true,
          codecHint: 'WebTorrent stream server 已就绪。',
        },
        task: reduceTorrentTask(current.task, {
          type: 'status',
          status: 'fetching-metadata',
        }),
      }))

      const torrent = addTorrent(runtime.client, input)
      torrentRef.current = torrent
      attachTorrentEvents(torrent, runtime.client, selectFile)

      metadataTimerRef.current = window.setTimeout(() => {
        if (!torrentRef.current?.ready) {
          setFatalError({
            code: 'metadata-timeout',
            message: 'metadata 获取超时。',
            recoveryAction: '继续等待，或确认来源包含 WebRTC tracker / Web Seed。',
          })
        }
      }, 45000)

      refreshTimerRef.current = window.setInterval(refreshFromTorrent, 1000)

      if (input.kind === 'magnet') {
        setState((current) => ({
          ...current,
          recentInputs: rememberMagnetInput({
            label: input.label,
            value: input.value,
            savedAt: Date.now(),
          }),
        }))
      }
    } catch (error) {
      setFatalError(normalizeError(error))
    }
  }, [addTorrent, appendActivity, attachTorrentEvents, refreshFromTorrent, selectFile, setFatalError, stop])

  const startMagnet = useCallback(async (value: string) => {
    try {
      await startInput(magnetInputFromText(value))
    } catch (error) {
      setFatalError(normalizeError(error))
    }
  }, [setFatalError, startInput])

  const startTorrentFile = useCallback(async (file: File) => {
    try {
      await startInput(await readTorrentFile(file))
    } catch (error) {
      setFatalError(normalizeError(error))
    }
  }, [setFatalError, startInput])

  const bindMediaElement = useCallback((element: HTMLMediaElement | null) => {
    mediaElementRef.current = element
    const selectedPath = selectedPathRef.current
    if (element && selectedPath) {
      const file = filesRef.current.get(selectedPath)
      file?.streamTo(element)
    }
  }, [])

  const setDiagnosticOpen = useCallback((open: boolean) => {
    setState((current) => ({ ...current, diagnosticOpen: open }))
  }, [])

  const clearError = useCallback(() => {
    setState((current) => ({
      ...current,
      task: {
        ...current.task,
        error: undefined,
        status: current.task.status === 'error' ? 'idle' : current.task.status,
      },
      playback: {
        ...current.playback,
        error: undefined,
        status: current.playback.status === 'error' ? 'idle' : current.playback.status,
      },
    }))
  }, [])

  const clearRecent = useCallback(() => {
    localStorage.removeItem('torrent-player.recent-inputs.v1')
    setState((current) => ({ ...current, recentInputs: [] }))
  }, [])

  const mediaHandlers = useMemo(() => ({
    onLoadStart: () => {
      setState((current) => ({
        ...current,
        playback: {
          ...current.playback,
          buffering: true,
          status: current.playback.filePath ? 'buffering' : current.playback.status,
        },
      }))
    },
    onLoadedMetadata: () => {
      const media = mediaElementRef.current
      setState((current) => ({
        ...current,
        playback: {
          ...current.playback,
          duration: media?.duration ?? 0,
          buffering: false,
          status: 'ready',
        },
      }))
    },
    onWaiting: () => {
      setState((current) => ({
        ...current,
        task: reduceTorrentTask(current.task, { type: 'status', status: 'buffering' }),
        playback: {
          ...current.playback,
          buffering: true,
          status: 'buffering',
        },
      }))
    },
    onPlaying: () => {
      setState((current) => ({
        ...current,
        task: reduceTorrentTask(current.task, { type: 'status', status: 'playing' }),
        playback: {
          ...current.playback,
          buffering: false,
          status: 'playing',
        },
      }))
    },
    onPause: () => {
      setState((current) => ({
        ...current,
        task: current.task.status === 'playing'
          ? reduceTorrentTask(current.task, { type: 'status', status: 'paused' })
          : current.task,
        playback: {
          ...current.playback,
          status: current.playback.status === 'playing' ? 'paused' : current.playback.status,
        },
      }))
    },
    onTimeUpdate: () => {
      const media = mediaElementRef.current
      setState((current) => ({
        ...current,
        playback: {
          ...current.playback,
          currentTime: media?.currentTime ?? current.playback.currentTime,
          duration: media?.duration ?? current.playback.duration,
        },
      }))
    },
    onError: () => {
      setPlaybackError({
        code: 'playback-error',
        message: '浏览器无法播放当前媒体。',
        technicalDetail: mediaElementRef.current?.error?.message,
        recoveryAction: '尝试选择 MP4/WebM/MP3 等浏览器原生支持的文件，或换用其它来源。',
      })
    },
  }), [setPlaybackError])

  useEffect(() => {
    const handleBeforeUnload = () => {
      runtimeRef.current?.client._server?.close?.()
      runtimeRef.current?.client.destroy()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearTimers()
      runtimeRef.current?.client._server?.close?.()
      runtimeRef.current?.client.destroy()
    }
  }, [clearTimers])

  return {
    ...state,
    startMagnet,
    startTorrentFile,
    selectFile,
    stop,
    clearError,
    clearRecent,
    setDiagnosticOpen,
    bindMediaElement,
    mediaHandlers,
  }
}

function normalizeError(error: unknown): AppError {
  if (isAppError(error)) return error

  return {
    code: 'webtorrent-error',
    message: '操作失败。',
    technicalDetail: messageFromUnknown(error),
    recoveryAction: '确认输入有效后重试；如果持续失败，请停止任务并刷新页面。',
  }
}

function isAppError(value: unknown): value is AppError {
  if (!value || typeof value !== 'object') return false
  const candidate = value as AppError
  return typeof candidate.code === 'string' &&
    typeof candidate.message === 'string' &&
    typeof candidate.recoveryAction === 'string'
}

function createEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `event-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
