import {
  Activity,
  Gauge,
  HardDriveDownload,
  Radio,
} from 'lucide-react'
import { formatPercent, formatSpeed, formatTaskStatus } from '../lib/format'
import type { TorrentTask } from '../webtorrent/types'

type TorrentStatusPanelProps = {
  task: TorrentTask
  sourceLabel?: string
}

export function TorrentStatusPanel({ task, sourceLabel }: TorrentStatusPanelProps) {
  const progressWidth = `${Math.max(0, Math.min(task.progress * 100, 100))}%`
  const progressValue = Math.round(Math.max(0, Math.min(task.progress * 100, 100)))
  const metrics = [
    {
      label: '任务',
      value: formatTaskStatus(task.status),
      icon: Activity,
    },
    {
      label: '进度',
      value: formatPercent(task.progress),
      icon: Gauge,
    },
    {
      label: '下载速度',
      value: formatSpeed(task.downloadSpeed),
      icon: HardDriveDownload,
    },
    {
      label: '连接节点',
      value: String(task.numPeers),
      icon: Radio,
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
                <span
                  className="metric-track"
                  role="progressbar"
                  aria-label={`下载进度 ${metric.value}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressValue}
                >
                  <span style={{ width: progressWidth }} aria-hidden="true" />
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
