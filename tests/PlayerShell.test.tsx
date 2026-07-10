import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlayerShell } from '../src/components/PlayerShell'
import { emptyTorrentTask, type PlaybackState } from '../src/webtorrent/types'

const mediaHandlers = {
  onLoadStart: vi.fn(),
  onLoadedMetadata: vi.fn(),
  onWaiting: vi.fn(),
  onPlaying: vi.fn(),
  onPause: vi.fn(),
  onTimeUpdate: vi.fn(),
  onError: vi.fn(),
}

describe('PlayerShell', () => {
  it('removes empty monitor decoration when a media file is mounted', () => {
    const playback: PlaybackState = {
      filePath: 'sample.mp4',
      fileName: 'sample.mp4',
      mediaKind: 'video',
      status: 'ready',
      currentTime: 0,
      duration: 0,
      buffering: false,
    }

    const { container } = render(
      <PlayerShell
        playback={playback}
        task={{ ...emptyTorrentTask, status: 'ready' }}
        bindMediaElement={vi.fn()}
        mediaHandlers={mediaHandlers}
      />,
    )

    expect(screen.getByLabelText('sample.mp4 视频播放器')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('准备就绪')
    expect(container.querySelector('.player-frame')).toHaveClass('has-media')
    expect(container.querySelector('.monitor-reticle')).not.toBeInTheDocument()
  })
})
