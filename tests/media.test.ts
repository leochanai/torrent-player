import { describe, expect, it } from 'vitest'
import { chooseDefaultPlayableFile, classifyMediaFile, toTorrentFileItem } from '../src/lib/media'
import type { MinimalWebTorrentFile, TorrentFileItem } from '../src/webtorrent/types'

describe('media helpers', () => {
  it('classifies common browser-playable video and audio files', () => {
    expect(classifyMediaFile('movie.mp4', 'video/mp4').kind).toBe('video')
    expect(classifyMediaFile('track.mp3', 'audio/mpeg').kind).toBe('audio')
  })

  it('marks legacy containers as unsupported', () => {
    const result = classifyMediaFile('clip.avi')

    expect(result.kind).toBe('unsupported')
    expect(result.codecHint).toContain('浏览器')
  })

  it('prefers video over audio for the default playable file', () => {
    const files: TorrentFileItem[] = [
      makeItem('song.mp3', 'audio'),
      makeItem('movie.webm', 'video'),
    ]

    expect(chooseDefaultPlayableFile(files)?.name).toBe('movie.webm')
  })

  it('maps WebTorrent file stats to serializable UI state', () => {
    const item = toTorrentFileItem(makeWebTorrentFile(), 'movie.mp4')

    expect(item).toMatchObject({
      name: 'movie.mp4',
      size: 1024,
      downloaded: 512,
      progress: 0.5,
      playableKind: 'video',
      selected: true,
    })
  })
})

function makeItem(name: string, playableKind: TorrentFileItem['playableKind']): TorrentFileItem {
  return {
    path: name,
    name,
    size: 1,
    mimeType: '',
    downloaded: 0,
    progress: 0,
    playableKind,
    selected: false,
  }
}

function makeWebTorrentFile(): MinimalWebTorrentFile {
  return {
    name: 'movie.mp4',
    path: 'movie.mp4',
    length: 1024,
    size: 1024,
    type: 'video/mp4',
    downloaded: 512,
    progress: 0.5,
    streamURL: '/webtorrent/hash/movie.mp4',
    select: () => undefined,
    deselect: () => undefined,
    streamTo: (element) => element,
  }
}
