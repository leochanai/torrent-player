# session-handoff.md

## 当前状态

- V1 已实现为纯浏览器 WebTorrent 磁力播放器。
- 本地 dev server 当前可访问：`http://127.0.0.1:5174/`。
- 当前目录不是 Git 仓库，未 commit、未 push。

## 已完成

- [x] 初始化 Vite + React + TypeScript 项目、package scripts、ESLint、Vitest、React Testing Library。
- [x] 实现 WebTorrent runtime：WebRTC/Service Worker 能力检测、SW 注册、stream server、client/torrent error、stop/destroy。
- [x] 实现 magnet 与 `.torrent` 输入：合法性校验、50 MB torrent 文件限制、最近 magnet 本地保存。
- [x] 实现播放器工作台：来源输入、文件列表、状态指标、事件、诊断、停止任务、桌面三栏与移动单列。
- [x] 实现媒体识别和默认文件选择，支持 `file.streamTo(video/audio)`。
- [x] 修复 Vite dev 不能 import public WebTorrent bundle 的问题，改为 `webtorrent-loader.js` 原生 module script。
- [x] 修复 `no-peers` 可恢复状态：后续 stats 出现 peer 或下载流量时清除错误。
- [x] 修复移动端长内容和播放器比例导致的横向溢出。
- [x] 更新 `docs/ARCHITECTURE.md`、`docs/DESIGN.md`、`docs/PRODUCT.md` 与本交接记录。

## 已验证

- [x] `npm run lint` 通过。
- [x] `npm run test` 通过：4 个测试文件、15 个测试。
- [x] `npm run build` 通过。
- [x] 浏览器桌面 `1280x720`：三栏布局存在，`scrollWidth=clientWidth=1280`。
- [x] 浏览器移动 `390x844`：单列布局存在，`scrollWidth=clientWidth=390`。
- [x] 合法 WebTorrent 样例 Sintel magnet：5 秒内 Service Worker / Stream server ready，metadata ready，11 个文件出现，`Sintel.mp4` 自动挂到 video，Peers=1，下载有速度，任务状态为 `buffering`。
- [x] 截图已保存：`artifacts/screenshots/desktop-1280.png`、`artifacts/screenshots/mobile-390.png`、`artifacts/screenshots/live-magnet-390.png`。

## 未验证

- [ ] 未验证真实用户本地 `.torrent` 文件导入路径，只由 parser 单元测试覆盖文件类型、大小和读取逻辑。
- [ ] 未验证 Safari / Firefox / Android 浏览器；当前浏览器烟测只覆盖本机应用内 Chromium 环境。
- [ ] 未验证公网部署、CSP、HTTPS、缓存策略和生产 CDN。

## 当前风险

- `npm audit --omit=dev --json` 报告 4 个 high，来自 `webtorrent -> torrent-discovery -> bittorrent-tracker -> ip`。npm 建议降级到 `webtorrent@0.7.3`，不适用于当前 3.x API，未执行。
- 浏览器版 WebTorrent 仍只承诺 WebRTC peers 与 Web Seed；普通 TCP/UDP peers 需要未来桌面/Node bridge 方案。
- 播放成功依赖 tracker、WebRTC、Web Seed、Service Worker 和浏览器解码能力；外部网络波动仍可能导致 metadata 超时或 no peers。
- 产品必须继续保持合法使用边界，不做内容搜索、资源站聚合、推荐或侵权规避。

## 下一步最佳动作

1. 用用户自己的合法 magnet / `.torrent` 文件做一次人工验收，尤其验证 `.torrent` 文件导入。
2. 若准备发布公网，先做安全/合规/CSP/依赖升级评审。
3. 若需要普通 BT peer、后台下载或持久保存文件，开启 V2 桌面/Node bridge 架构评审。
