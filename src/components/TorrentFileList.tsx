import { FileAudio2, FileQuestion, FileVideo2, PlayCircle } from 'lucide-react'
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
        <span className="heading-count">{files.length}</span>
      </div>

      {files.length === 0 ? (
        <p className="empty-copy">metadata 就绪后会显示 torrent 文件列表。</p>
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
                      {formatBytes(file.size)} · {file.mimeType || 'unknown'} · {formatPercent(file.progress)}
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
