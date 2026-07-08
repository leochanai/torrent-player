# session-handoff.md

## 当前状态

- V1 已实现为纯浏览器 WebTorrent 磁力播放器。
- UI 已按用户确认的“黑匣子信号甲板”概念图重设计：硬边面板、顶部能力状态甲板、左侧来源/文件轨、中央播放监视器、任务信息/操作面板和右侧状态/事件/诊断纵列。
- 本地 dev server 当前可访问：`http://127.0.0.1:5174/`。
- 当前目录是 Git 仓库；本轮改动尚未 commit、未 push。

## 已完成

- [x] 初始化 Vite + React + TypeScript 项目、package scripts、ESLint、Vitest、React Testing Library。
- [x] 实现 WebTorrent runtime：WebRTC/Service Worker 能力检测、SW 注册、stream server、client/torrent error、stop/destroy。
- [x] 实现 magnet 与 `.torrent` 输入：合法性校验、50 MB torrent 文件限制、最近 magnet 本地保存。
- [x] 实现播放器工作台：来源输入、文件列表、状态指标、事件、诊断、停止任务、桌面三栏与移动单列。
- [x] 实现媒体识别和默认文件选择，支持 `file.streamTo(video/audio)`。
- [x] 修复 Vite dev 不能 import public WebTorrent bundle 的问题，改为 `webtorrent-loader.js` 原生 module script。
- [x] 修复 `no-peers` 可恢复状态：后续 stats 出现 peer 或下载流量时清除错误。
- [x] 重设计 UI：引入本地打包的 Chakra Petch / IBM Plex Sans / JetBrains Mono latin 字体；替换通用暗色卡片为工业信号甲板视觉系统。
- [x] 修复移动端 no-peers 错误横幅被按钮挤压导致中文竖排的问题。
- [x] 修复长 WebTorrent warning / tracker URL 事件行撑宽右侧事件面板导致桌面横向溢出的问题。
- [x] 修复桌面端滚动到底后中间出现大块空黑区域的问题：桌面改为固定甲板，三列在各自舱内滚动；移动端保留整页滚动。
- [x] 精简右侧主状态字段：主状态仅保留来源、任务、进度、下载、Peers 和 Stream server；上传、Ratio、已下载和底层能力细节移动到诊断。
- [x] 更新 `docs/ARCHITECTURE.md`、`docs/DESIGN.md`、`docs/PRODUCT.md` 与本交接记录。

## 已验证

- [x] `npm run lint` 通过。
- [x] `npm run test` 通过：4 个测试文件、15 个测试。
- [x] `npm run build` 通过。
- [x] Browser/IAB 桌面 `1280x720`：三栏布局存在，`scrollWidth=clientWidth=1280`，无框架错误遮罩，无 console error/warn。
- [x] Browser/IAB 桌面 `1440x900`：概念图主构图完整可见，任务信息、任务操作和右侧事件区域进入同一屏。
- [x] Browser/IAB 桌面 `1440x900`：右侧状态列滚到底后，`documentScrollHeight=documentClientHeight=900`，页面本身不滚动，中间播放/任务区域保持可见，`scrollWidth=clientWidth=1440`。
- [x] Browser/IAB 桌面 `1440x900`：主状态不再显示上传、Ratio、已下载；展开诊断后可见上传速度、Ratio、已下载；无 console error/warn，`scrollWidth=clientWidth=1440`。
- [x] Browser/IAB 移动 `390x844`：单列布局存在，`scrollWidth=clientWidth=390`，顶部状态甲板、来源输入和播放器区域无横向溢出。
- [x] 非法 magnet：输入 `not a magnet` 后显示“这不是 magnet URI。”，不创建任务。
- [x] 合法 Sintel magnet 烟测：Stream server ready；14 秒内 peers 为 0，metadata 未就绪，进入 `no-peers` 可恢复诊断路径；停止任务后资源释放。
- [x] 合法 Big Buck Bunny 完整 magnet 烟测：1 秒内 metadata ready，3 个文件出现，自动选中 `Big Buck Bunny.mp4`，视频元素挂载，任务进入 `buffering`，Peers=1，下载约 `452 KB/s`；停止任务后资源释放。
- [x] 截图已更新：`artifacts/screenshots/desktop-1280.png`、`artifacts/screenshots/desktop-1440.png`、`artifacts/screenshots/desktop-scroll-bottom-1440.png`、`artifacts/screenshots/mobile-390.png`、`artifacts/screenshots/live-magnet-390.png`、`artifacts/screenshots/live-big-buck-bunny-1440.png`。

## 未验证

- [ ] 未验证真实用户本地 `.torrent` 文件导入路径，只由 parser 单元测试覆盖文件类型、大小和读取逻辑。
- [ ] 本轮未验证完整播放到画面开始播放；Big Buck Bunny 已验证到 metadata ready、文件选择、video 挂载和 buffering。
- [ ] 未验证 Safari / Firefox / Android 浏览器；当前浏览器烟测只覆盖本机应用内 Chromium 环境。
- [ ] 未验证公网部署、CSP、HTTPS、缓存策略和生产 CDN。

## 当前风险

- `npm audit --omit=dev --json` 报告 4 个 high，来自 `webtorrent -> torrent-discovery -> bittorrent-tracker -> ip`。npm 建议降级到 `webtorrent@0.7.3`，不适用于当前 3.x API，未执行。
- 浏览器版 WebTorrent 仍只承诺 WebRTC peers 与 Web Seed；普通 TCP/UDP peers 需要未来桌面/Node bridge 方案。
- 播放成功依赖 tracker、WebRTC、Web Seed、Service Worker 和浏览器解码能力；外部网络波动仍可能导致 metadata 超时或 no peers。
- 产品必须继续保持合法使用边界，不做内容搜索、资源站聚合、推荐或侵权规避。

## 下一步最佳动作

1. 用用户自己的合法 magnet / `.torrent` 文件做一次人工验收，尤其验证 `.torrent` 文件导入和真实可播放路径。
2. 若准备发布公网，先做安全/合规/CSP/依赖升级评审。
3. 若需要普通 BT peer、后台下载或持久保存文件，开启 V2 桌面/Node bridge 架构评审。
