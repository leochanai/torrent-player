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

  const supportTone =
    player.capabilities.webRtcSupported && player.capabilities.serviceWorkerSupported
      ? 'ok'
      : 'error'

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <RadioTower size={20} />
          </div>
          <div>
            <h1>Torrent Player</h1>
            <p>WebTorrent browser stream console</p>
          </div>
        </div>

        <div className="topbar-status" aria-label="运行能力状态">
          <span className={`status-pill ${supportTone}`}>
            {supportTone === 'ok' ? <CheckCircle2 size={15} /> : <WifiOff size={15} />}
            WebRTC / SW
          </span>
          <span className={`status-pill ${player.capabilities.streamServerReady ? 'ok' : 'idle'}`}>
            <Signal size={15} />
            Stream server
          </span>
          <span className="status-pill lawful">
            <ShieldCheck size={15} />
            合法来源
          </span>
        </div>
      </header>

      <section className="notice-strip" aria-label="使用边界">
        <ShieldCheck size={16} />
        <span>
          仅用于播放用户自有或合法授权内容。浏览器版 WebTorrent 主要连接 WebRTC peers 和 Web Seed，不承诺普通 TCP/UDP peers。
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

          <div className="quick-actions" aria-label="任务操作">
            <button className="button danger" type="button" onClick={player.stop}>
              <StopCircle size={17} />
              停止任务
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => player.setDiagnosticOpen(!player.diagnosticOpen)}
            >
              <Activity size={17} />
              {player.diagnosticOpen ? '收起诊断' : '展开诊断'}
            </button>
          </div>

          {player.task.error ? (
            <div className="error-banner" role="alert">
              <AlertTriangle size={18} />
              <div>
                <strong>{player.task.error.message}</strong>
                <span>{player.task.error.recoveryAction}</span>
              </div>
              <button className="button ghost compact" type="button" onClick={player.clearError}>
                清除
              </button>
            </div>
          ) : null}
        </section>

        <aside className="workspace-panel status-column" aria-label="任务状态和诊断">
          <TorrentStatusPanel
            task={player.task}
            capabilities={player.capabilities}
            sourceLabel={player.sourceLabel}
          />

          <div className="activity-panel">
            <div className="panel-heading">
              <FileVideo2 size={17} />
              <h2>事件</h2>
            </div>
            {player.activity.length === 0 ? (
              <p className="empty-copy">添加 magnet 或 .torrent 后会显示关键事件。</p>
            ) : (
              <ol className="activity-list">
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
