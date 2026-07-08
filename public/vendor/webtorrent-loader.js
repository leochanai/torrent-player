import WebTorrent from './webtorrent.min.js'
window.WebTorrent = WebTorrent
window.dispatchEvent(new CustomEvent('webtorrent:ready'))
