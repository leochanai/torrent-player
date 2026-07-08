import { AudioLines, Loader2, MonitorPlay } from 'lucide-react'
import { formatDuration } from '../lib/format'
import type { PlaybackState, TorrentTask } from '../webtorrent/types'

type PlayerShellProps = {
  playback: PlaybackState
  task: TorrentTask
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

export function PlayerShell({
  playback,
  task,
  bindMediaElement,
  mediaHandlers,
}: PlayerShellProps) {
  const isAudio = playback.mediaKind === 'audio'

  return (
    <section className="player-shell">
      <div className="panel-heading player-heading">
        <MonitorPlay size={17} />
        <h2>播放监视器</h2>
        <span className="panel-index">03</span>
      </div>

      <div className="player-frame">
        <span className="scope-corner top-left" aria-hidden="true" />
        <span className="scope-corner top-right" aria-hidden="true" />
        <span className="scope-corner bottom-left" aria-hidden="true" />
        <span className="scope-corner bottom-right" aria-hidden="true" />
        <span className="signal-axis" aria-hidden="true" />
        <span className="monitor-reticle" aria-hidden="true" />

        {playback.filePath ? (
          isAudio ? (
            <div className="audio-stage">
              <AudioLines size={56} />
              <p>{playback.fileName}</p>
              <audio
                ref={bindMediaElement}
                controls
                onLoadStart={mediaHandlers.onLoadStart}
                onLoadedMetadata={mediaHandlers.onLoadedMetadata}
                onWaiting={mediaHandlers.onWaiting}
                onPlaying={mediaHandlers.onPlaying}
                onPause={mediaHandlers.onPause}
                onTimeUpdate={mediaHandlers.onTimeUpdate}
                onError={mediaHandlers.onError}
              />
            </div>
          ) : (
            <video
              ref={bindMediaElement}
              controls
              playsInline
              onLoadStart={mediaHandlers.onLoadStart}
              onLoadedMetadata={mediaHandlers.onLoadedMetadata}
              onWaiting={mediaHandlers.onWaiting}
              onPlaying={mediaHandlers.onPlaying}
              onPause={mediaHandlers.onPause}
              onTimeUpdate={mediaHandlers.onTimeUpdate}
              onError={mediaHandlers.onError}
            />
          )
        ) : (
          <div className="player-empty">
            <MonitorPlay size={52} />
            <h2>等待可播放文件</h2>
            <p>输入 magnet 或导入 .torrent 后，metadata 就绪时会自动选择第一个可播放媒体。</p>
          </div>
        )}

        {playback.buffering ? (
          <div className="buffering-layer" aria-live="polite">
            <Loader2 size={22} />
            <span>正在拉取播放片段</span>
          </div>
        ) : null}
      </div>

      <div className="panel-heading meta-heading">
        <MonitorPlay size={17} />
        <h2>任务信息</h2>
        <span className="panel-index">04</span>
      </div>

      <div className="player-meta">
        <div>
          <span>当前文件</span>
          <strong>{playback.fileName ?? '未选择'}</strong>
        </div>
        <div>
          <span>播放时间</span>
          <strong>
            {formatDuration(playback.currentTime)} / {formatDuration(playback.duration)}
          </strong>
        </div>
        <div>
          <span>任务状态</span>
          <strong>{task.status}</strong>
        </div>
      </div>
    </section>
  )
}
