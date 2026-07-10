import { useState, type DragEvent } from 'react'
import {
  FileUp,
  Link2,
  Play,
  RotateCcw,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { parseMagnetInput } from '../webtorrent/sourceParser'
import type { RecentInput } from '../lib/storage'

type SourceInputProps = {
  disabled: boolean
  recentInputs: RecentInput[]
  onStartMagnet: (value: string) => Promise<void>
  onStartTorrentFile: (file: File) => Promise<void>
  onClearRecent: () => void
}

export function SourceInput({
  disabled,
  recentInputs,
  onStartMagnet,
  onStartTorrentFile,
  onClearRecent,
}: SourceInputProps) {
  const [value, setValue] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [localError, setLocalError] = useState<string>()
  const errorId = 'magnet-input-error'

  async function submitMagnet() {
    const parsed = parseMagnetInput(value)
    if (!parsed.ok) {
      setLocalError(parsed.error.message)
      return
    }

    setLocalError(undefined)
    await onStartMagnet(value)
  }

  async function submitFile(file: File | undefined) {
    if (!file || disabled) return
    setLocalError(undefined)
    await onStartTorrentFile(file)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragActive(false)
    if (disabled) return
    void submitFile(event.dataTransfer.files.item(0) ?? undefined)
  }

  function clearMagnet() {
    setValue('')
    setLocalError(undefined)
  }

  return (
    <section className="source-input deck-section">
      <div className="panel-heading">
        <Link2 size={17} />
        <h2>来源</h2>
        <span className="panel-index">01</span>
      </div>

      <label className="field-label" htmlFor="magnet-input">
        Magnet URI
      </label>
      <div className="source-console">
        <textarea
          id="magnet-input"
          value={value}
          placeholder="magnet:?xt=urn:btih:..."
          disabled={disabled}
          spellCheck={false}
          aria-invalid={Boolean(localError)}
          aria-describedby={localError ? errorId : undefined}
          onChange={(event) => {
            setValue(event.target.value)
            setLocalError(undefined)
          }}
        />
      </div>
      {localError ? (
        <p className="field-error" id={errorId} role="alert">
          {localError}
        </p>
      ) : null}

      <div className="button-row">
        <button className="button primary" type="button" disabled={disabled} onClick={submitMagnet}>
          <Play size={17} />
          开始解析
        </button>
        <button
          className="button secondary"
          type="button"
          onClick={clearMagnet}
          disabled={!value}
        >
          <RotateCcw size={17} />
          清空
        </button>
      </div>

      <label
        className={`dropzone ${dragActive ? 'active' : ''}`}
        data-state={disabled ? 'disabled' : dragActive ? 'active' : 'idle'}
        aria-disabled={disabled}
        onDragOver={(event) => {
          event.preventDefault()
          if (disabled) return
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <UploadCloud size={22} />
        <span>拖入 .torrent 文件</span>
        <small>或点击选择本地 torrent 文件</small>
        <input
          type="file"
          accept=".torrent,application/x-bittorrent"
          disabled={disabled}
          aria-label="选择 .torrent 文件"
          onChange={(event) => void submitFile(event.target.files?.item(0) ?? undefined)}
        />
      </label>

      {recentInputs.length > 0 ? (
        <div className="recent-box">
          <div className="recent-heading">
            <span>最近来源</span>
            <button className="icon-button" type="button" onClick={onClearRecent} aria-label="清除最近来源">
              <Trash2 size={15} />
            </button>
          </div>
          <div className="recent-list">
            {recentInputs.map((item) => (
              <button
                className="recent-item"
                type="button"
                key={item.value}
                onClick={() => {
                  setValue(item.value)
                  setLocalError(undefined)
                }}
              >
                <FileUp size={14} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
