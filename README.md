# Torrent Player

Torrent Player is a local-first browser WebTorrent player. It accepts a user-provided magnet URI or `.torrent` file, shows torrent metadata and transfer state, and streams a playable audio/video file through the browser media element.

This project is intentionally not a content discovery product. It does not provide search, recommendations, resource aggregation, cloud download, transcoding, accounts, or a backend service. Use it only with content you own or are authorized to access.

## Current Scope

- Magnet URI input.
- `.torrent` file import.
- WebTorrent browser runtime with Service Worker stream server.
- File list, peers, speed, progress, ratio, recent events, and diagnostics.
- Automatic selection of the first playable media file.
- Responsive dark workbench UI for desktop and mobile browsers.

Browser WebTorrent mainly connects to WebRTC peers and Web Seeds. Ordinary TCP/UDP BitTorrent peers are not part of the browser V1 promise.

## Run Locally

```bash
npm install
npm run dev
```

`npm install` runs `postinstall`, which refreshes the WebTorrent browser assets in `public/`:

- `public/sw.min.js`
- `public/vendor/webtorrent.min.js`
- `public/vendor/webtorrent-loader.js`

## Checks

```bash
npm run lint
npm run test
npm run build
```

Latest local verification passed lint, tests, build, desktop/mobile browser layout checks, invalid magnet validation, and a live Big Buck Bunny WebTorrent magnet smoke test. The latest Big Buck Bunny run reached metadata ready, selected `Big Buck Bunny.mp4`, mounted the video element, and entered buffering with one peer.

## Known Risk

`npm audit --omit=dev` currently reports 4 high vulnerabilities through the `webtorrent -> torrent-discovery -> bittorrent-tracker -> ip` dependency chain. npm suggests downgrading to `webtorrent@0.7.3`, which is not compatible with this V1 implementation based on WebTorrent 3.x browser APIs.

See [WebTorrent API docs](https://webtorrent.io/docs) and [webtorrent/webtorrent](https://github.com/webtorrent/webtorrent) for upstream behavior and browser limitations.
