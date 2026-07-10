import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileVideo2,
  RadioTower,
  ShieldCheck,
  Signal,
  StopCircle,
  WifiOff,
} from 'lucide-react'
import { DiagnosticsPanel } from '../components/DiagnosticsPanel'
import { PlayerShell } from '../components/PlayerShell'
import { SourceInput } from '../components/SourceInput'
import { TorrentFileList } from '../components/TorrentFileList'
import { TorrentStatusPanel } from '../components/TorrentStatusPanel'
import { useTorrentPlayer } from './useTorrentPlayer'

export function App() {
  const player = useTorrentPlayer()

  const webRtcTone = player.capabilities.webRtcSupported ? 'ok' : 'error'
  const serviceWorkerTone = player.capabilities.serviceWorkerSupported ? 'ok' : 'error'
  const readyCapabilityCount = [
    player.capabilities.webRtcSupported,
    player.capabilities.serviceWorkerSupported,
    player.capabilities.streamServerReady,
  ].filter(Boolean).length
  const hasActiveTask = !['idle', 'stopped', 'unsupported'].includes(player.task.status)
  const capabilityLabel = [
    `WebRTC ${player.capabilities.webRtcSupported ? '可用' : '不可用'}`,
    `Service Worker ${player.capabilities.serviceWorkerSupported ? '可用' : '不可用'}`,
    `流媒体服务 ${player.capabilities.streamServerReady ? '就绪' : '未就绪'}`,
  ].join('，')

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <RadioTower size={20} />
          </div>
          <div>
            <div className="brand-title-row">
              <h1>Torrent Player</h1>
              <span className="brand-badge">合法来源</span>
            </div>
            <p>Local WebTorrent signal deck</p>
          </div>
        </div>

        <div className="topbar-status" role="list" aria-label="运行能力状态">
          <span className={`status-pill ${webRtcTone}`} role="listitem">
            {webRtcTone === 'ok' ? <CheckCircle2 size={15} /> : <WifiOff size={15} />}
            <span>WebRTC</span>
            <i aria-hidden="true" />
          </span>
          <span className={`status-pill ${serviceWorkerTone}`} role="listitem">
            {serviceWorkerTone === 'ok' ? <CheckCircle2 size={15} /> : <WifiOff size={15} />}
            <span>Service Worker</span>
            <i aria-hidden="true" />
          </span>
          <span
            className={`status-pill ${player.capabilities.streamServerReady ? 'ok' : 'idle'}`}
            role="listitem"
          >
            <Signal size={15} />
            <span>Stream server</span>
            <i aria-hidden="true" />
          </span>
        </div>

        <div
          className={`topbar-compact-status ${readyCapabilityCount === 3 ? 'ok' : 'pending'}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label={capabilityLabel}
        >
          <Signal size={16} aria-hidden="true" />
          <span>运行环境</span>
          <strong>{readyCapabilityCount}/3 已就绪</strong>
        </div>

        <div className="topbar-local" aria-label="本地优先状态">
          <strong>本地运行</strong>
          <span>任务与来源不上传</span>
        </div>
      </header>

      <section className="notice-strip" aria-label="使用边界">
        <ShieldCheck size={16} />
        <span>
          <strong>仅播放自有或合法授权内容。</strong> 浏览器版连接 WebRTC peers 与 Web Seed，
          不支持普通 TCP/UDP peers。
        </span>
      </section>

      <section className="workspace" aria-label="Torrent Player 工作台">
        <aside className="workspace-panel source-column" aria-label="来源和文件列表">
          <SourceInput
            disabled={player.task.status === 'fetching-metadata' || player.task.status === 'buffering'}
            recentInputs={player.recentInputs}
            onStartMagnet={player.startMagnet}
            onStartTorrentFile={player.startTorrentFile}
            onClearRecent={player.clearRecent}
          />
          <TorrentFileList files={player.files} onSelectFile={player.selectFile} />
        </aside>

        <section className="player-column" aria-label="播放区域">
          <PlayerShell
            playback={player.playback}
            task={player.task}
            bindMediaElement={player.bindMediaElement}
            mediaHandlers={player.mediaHandlers}
          />

          <div className="task-actions" aria-label="任务操作">
            <div className="panel-heading">
              <Activity size={17} />
              <h2>任务操作</h2>
              <span className="panel-index">05</span>
            </div>
            <div className="quick-actions">
              {hasActiveTask ? (
                <button className="button danger" type="button" onClick={player.stop}>
                  <StopCircle size={17} />
                  停止任务
                </button>
              ) : null}
              <button
                className="button secondary"
                type="button"
                onClick={() => player.setDiagnosticOpen(!player.diagnosticOpen)}
                aria-expanded={player.diagnosticOpen}
                aria-controls="diagnostics-panel"
              >
                <Activity size={17} />
                {player.diagnosticOpen ? '收起诊断' : '展开诊断'}
              </button>
            </div>
          </div>

          {player.task.error ? (
            <div className="error-banner" role="alert">
              <AlertTriangle size={18} />
              <div>
                <strong>{player.task.error.message}</strong>
                <span>{player.task.error.recoveryAction}</span>
              </div>
              <button className="button ghost compact" type="button" onClick={player.clearError}>
                清除错误
              </button>
            </div>
          ) : null}
        </section>

        <aside className="workspace-panel status-column" aria-label="任务状态和诊断">
          <TorrentStatusPanel
            task={player.task}
            sourceLabel={player.sourceLabel}
          />

          <div className="activity-panel">
            <div className="panel-heading">
              <FileVideo2 size={17} />
              <h2>事件</h2>
              <span className="panel-index">07</span>
            </div>
            {player.activity.length === 0 ? (
              <p className="empty-copy">添加 magnet 或 .torrent 后会显示关键事件。</p>
            ) : (
              <ol className="activity-list" aria-live="polite" aria-relevant="additions">
                {player.activity.map((event) => (
                  <li className={event.tone} key={event.id}>
                    <span>{event.label}</span>
                    {event.detail ? <small>{event.detail}</small> : null}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {player.diagnosticOpen || player.task.error ? (
            <DiagnosticsPanel
              task={player.task}
              playback={player.playback}
              capabilities={player.capabilities}
            />
          ) : null}
        </aside>
      </section>
    </main>
  )
}
