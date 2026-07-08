import { describe, expect, it } from 'vitest'
import { isTorrentFile, magnetInputFromText, parseMagnetInput, readTorrentFile } from '../src/webtorrent/sourceParser'

describe('sourceParser', () => {
  it('accepts a valid magnet URI with btih hash', () => {
    const result = parseMagnetInput(
      'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel',
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.label).toBe('Sintel')
    }
  })

  it('rejects non-magnet input with a recoverable error', () => {
    const result = parseMagnetInput('https://example.com/movie.mp4')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('invalid-source')
      expect(result.error.recoveryAction).toContain('magnet:?')
    }
  })

  it('throws app errors when converting invalid magnet text', () => {
    expect(() => magnetInputFromText('')).toThrow(expect.objectContaining({
      code: 'invalid-source',
    }))
  })

  it('recognizes torrent files conservatively', () => {
    const torrentFile = new File(['abc'], 'sample.torrent', {
      type: 'application/x-bittorrent',
    })
    const textFile = new File(['abc'], 'sample.txt', {
      type: 'text/plain',
    })

    expect(isTorrentFile(torrentFile)).toBe(true)
    expect(isTorrentFile(textFile)).toBe(false)
  })

  it('reads a torrent file into a Uint8Array input', async () => {
    const torrentFile = new File([new Uint8Array([1, 2, 3])], 'sample.torrent')

    await expect(readTorrentFile(torrentFile)).resolves.toMatchObject({
      kind: 'torrent-file',
      label: 'sample.torrent',
      value: new Uint8Array([1, 2, 3]),
    })
  })
})
