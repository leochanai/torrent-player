import { FileAudio2, FileQuestion, FileVideo2, Hourglass, PlayCircle } from 'lucide-react'
import { formatBytes, formatPercent } from '../lib/format'
import { canRenderInMediaElement } from '../lib/media'
import type { TorrentFileItem } from '../webtorrent/types'

type TorrentFileListProps = {
  files: TorrentFileItem[]
  onSelectFile: (path: string) => void
}

export function TorrentFileList({ files, onSelectFile }: TorrentFileListProps) {
  return (
    <section className="file-list-panel">
      <div className="panel-heading">
        <FileVideo2 size={17} />
        <h2>文件</h2>
        <span className="panel-index">02</span>
        <span className="heading-count">{files.length}</span>
      </div>

      {files.length === 0 ? (
        <div className="file-empty-rail">
          <div className="file-table-head" aria-hidden="true">
            <span>文件名</span>
            <span>大小</span>
          </div>
          <div className="file-waiting">
            <Hourglass size={16} />
            <strong>等待可播放文件</strong>
            <span>metadata 就绪后会显示 torrent 文件列表。</span>
          </div>
        </div>
      ) : (
        <ul className="file-list">
          {files.map((file) => {
            const Icon = file.playableKind === 'audio'
              ? FileAudio2
              : file.playableKind === 'video'
                ? FileVideo2
                : FileQuestion
            const playable = canRenderInMediaElement(file)

            return (
              <li className={file.selected ? 'selected' : ''} key={file.path}>
                <div className="file-main">
                  <Icon size={18} />
                  <div>
                    <strong title={file.path}>{file.name}</strong>
                    <span>
                      {formatBytes(file.size)} · {file.mimeType || '类型未知'} · {formatPercent(file.progress)}
                    </span>
                    {file.codecHint ? <small>{file.codecHint}</small> : null}
                  </div>
                </div>
                <button
                  className="icon-button select-file"
                  type="button"
                  disabled={!playable}
                  onClick={() => onSelectFile(file.path)}
                  aria-label={`选择 ${file.name}`}
                  aria-pressed={file.selected}
                  title={playable ? '选择播放' : '浏览器可能无法直接播放'}
                >
                  <PlayCircle size={18} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
