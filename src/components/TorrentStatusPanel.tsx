import {
  Database,
  Gauge,
  HardDriveDownload,
  Radio,
  ServerCog,
  Upload,
} from 'lucide-react'
import { formatBytes, formatPercent, formatRatio, formatSpeed } from '../lib/format'
import type { CapabilityState, TorrentTask } from '../webtorrent/types'

type TorrentStatusPanelProps = {
  task: TorrentTask
  capabilities: CapabilityState
  sourceLabel?: string
}

export function TorrentStatusPanel({ task, capabilities, sourceLabel }: TorrentStatusPanelProps) {
  const progressWidth = `${Math.max(0, Math.min(task.progress * 100, 100))}%`
  const metrics = [
    {
      label: '进度',
      value: formatPercent(task.progress),
      icon: Gauge,
    },
    {
      label: '下载',
      value: formatSpeed(task.downloadSpeed),
      icon: HardDriveDownload,
    },
    {
      label: '上传',
      value: formatSpeed(task.uploadSpeed),
      icon: Upload,
    },
    {
      label: 'Peers',
      value: String(task.numPeers),
      icon: Radio,
    },
    {
      label: 'Ratio',
      value: formatRatio(task.ratio),
      icon: Database,
    },
    {
      label: '已下载',
      value: formatBytes(task.downloadedBytes),
      icon: ServerCog,
    },
  ]

  return (
    <section className="status-panel">
      <div className="panel-heading">
        <Gauge size={17} />
        <h2>状态</h2>
        <span className="panel-index">06</span>
      </div>

      <div className="source-summary">
        <span>来源</span>
        <strong>{sourceLabel ?? '尚未添加'}</strong>
      </div>

      <div className="status-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div className="metric-row" key={metric.label}>
              <Icon size={16} />
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              {metric.label === '进度' ? (
                <span className="metric-track" aria-hidden="true">
                  <span style={{ width: progressWidth }} />
                </span>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="capability-stack">
        <CapabilityRow label="WebRTC" ok={capabilities.webRtcSupported} />
        <CapabilityRow label="Service Worker" ok={capabilities.serviceWorkerSupported} />
        <CapabilityRow label="Stream server" ok={capabilities.streamServerReady} />
      </div>
      <p className="hint-copy">{capabilities.codecHint}</p>
    </section>
  )
}

function CapabilityRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`capability-row ${ok ? 'ok' : 'off'}`}>
      <span>{label}</span>
      <strong>{ok ? 'ready' : 'off'}</strong>
    </div>
  )
}
