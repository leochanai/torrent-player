import { Bug, CircleAlert, Database, HardDriveDownload, Network, ServerCog, Upload } from 'lucide-react'
import { formatBytes, formatRatio, formatSpeed } from '../lib/format'
import type { CapabilityState, PlaybackState, TorrentTask } from '../webtorrent/types'

type DiagnosticsPanelProps = {
  task: TorrentTask
  playback: PlaybackState
  capabilities: CapabilityState
}

export function DiagnosticsPanel({
  task,
  playback,
  capabilities,
}: DiagnosticsPanelProps) {
  const error = playback.error ?? task.error

  return (
    <section className="diagnostics-panel">
      <div className="panel-heading">
        <Bug size={17} />
        <h2>诊断</h2>
        <span className="panel-index">09</span>
      </div>

      {error ? (
        <div className="diagnostic-error">
          <CircleAlert size={18} />
          <div>
            <strong>{error.code}</strong>
            <span>{error.message}</span>
            <small>{error.recoveryAction}</small>
          </div>
        </div>
      ) : (
        <p className="empty-copy">暂无错误。遇到 no peers、metadata 超时或播放失败时，这里会展示恢复动作。</p>
      )}

      <dl className="diagnostic-list">
        <div>
          <dt>
            <Network size={14} />
            infoHash
          </dt>
          <dd>{task.infoHash ?? 'unknown'}</dd>
        </div>
        <div>
          <dt>
            <ServerCog size={14} />
            WebRTC
          </dt>
          <dd>{capabilities.webRtcSupported ? 'supported' : 'unsupported'}</dd>
        </div>
        <div>
          <dt>Service Worker</dt>
          <dd>{capabilities.serviceWorkerSupported ? 'supported' : 'unsupported'}</dd>
        </div>
        <div>
          <dt>Stream server</dt>
          <dd>{capabilities.streamServerReady ? 'ready' : 'not ready'}</dd>
        </div>
        <div>
          <dt>当前文件</dt>
          <dd>{playback.fileName ?? 'none'}</dd>
        </div>
        <div>
          <dt>
            <HardDriveDownload size={14} />
            已下载
          </dt>
          <dd>{formatBytes(task.downloadedBytes)}</dd>
        </div>
        <div>
          <dt>
            <Upload size={14} />
            上传速度
          </dt>
          <dd>{formatSpeed(task.uploadSpeed)}</dd>
        </div>
        <div>
          <dt>
            <Database size={14} />
            Ratio
          </dt>
          <dd>{formatRatio(task.ratio)}</dd>
        </div>
        <div>
          <dt>技术细节</dt>
          <dd>{error?.technicalDetail ?? 'none'}</dd>
        </div>
      </dl>
    </section>
  )
}
