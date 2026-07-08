# ARCHITECTURE.md

## 已确认事实

- 项目已实现为纯浏览器 Vite + React + TypeScript Web 应用。
- 核心依赖是 `webtorrent@3.0.16`；浏览器侧只能稳定承诺 WebRTC peers 与 Web Seed，不承诺普通 TCP/UDP BT peers。
- WebTorrent 浏览器流式播放依赖 Service Worker stream server 与 `file.streamTo(mediaElement)`。
- `node_modules/webtorrent/dist/sw.min.js` 复制到 `public/sw.min.js`；`webtorrent.min.js` 与 loader 复制到 `public/vendor/`。
- Vite dev 不能从源码直接 `import` public 资源；WebTorrent 浏览器 bundle 通过 `public/vendor/webtorrent-loader.js` 原生 module script 挂载到 `window.WebTorrent`。
- 当前目录不是 Git 仓库；不要假设有 `git diff`、commit 或 branch 工作流。

外部事实来源：

- WebTorrent GitHub：`https://github.com/webtorrent/webtorrent`
- WebTorrent API：`https://webtorrent.io/docs`

## 技术栈

- Vite + React + TypeScript。
- WebTorrent npm 包，用于浏览器端 torrent client。
- HTML `<video>` / `<audio>` 原生媒体播放。
- Service Worker，用于 WebTorrent browser stream server。
- 全局 CSS + `tokens.css`，不引入重型 UI 框架。
- `@fontsource/chakra-petch`、`@fontsource/ibm-plex-sans`、`@fontsource/jetbrains-mono`，用于本地打包的显示字体、正文字体和数据字体；当前只导入 latin 子集，中文走系统中文字体 fallback。
- Vitest + React Testing Library，覆盖 parser、media、task reducer 和基础 UI。
- lucide-react，用于按钮和状态图标。

## 运行命令

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
npm run preview
npm audit --omit=dev --json
```

`npm install` 后会运行 `postinstall`，执行 `scripts/copy-webtorrent-assets.mjs`，刷新：

- `public/sw.min.js`
- `public/vendor/webtorrent.min.js`
- `public/vendor/webtorrent-loader.js`

## 目录结构

```text
.
├── AGENTS.md
├── docs/
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   └── DESIGN.md
├── public/
│   ├── sw.min.js
│   └── vendor/
│       ├── webtorrent-loader.js
│       └── webtorrent.min.js
├── scripts/
│   └── copy-webtorrent-assets.mjs
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── useTorrentPlayer.ts
│   ├── components/
│   │   ├── DiagnosticsPanel.tsx
│   │   ├── PlayerShell.tsx
│   │   ├── SourceInput.tsx
│   │   ├── TorrentFileList.tsx
│   │   └── TorrentStatusPanel.tsx
│   ├── lib/
│   │   ├── format.ts
│   │   ├── media.ts
│   │   └── storage.ts
│   ├── styles/
│   │   ├── global.css
│   │   └── tokens.css
│   └── webtorrent/
│       ├── client.ts
│       ├── serviceWorker.ts
│       ├── sourceParser.ts
│       ├── taskState.ts
│       └── types.ts
├── tests/
└── session-handoff.md
```

## 核心模块

- `src/app/useTorrentPlayer.ts`：WebTorrent runtime owner；管理 client、torrent、file、media element、timers、recent inputs 和 UI 状态。
- `src/webtorrent/client.ts`：加载 WebTorrent browser bundle，创建 client，注册 client error，创建 stream server，添加 torrent，销毁 client。
- `src/webtorrent/serviceWorker.ts`：检测 WebRTC / Service Worker 能力，注册 `sw.min.js`，等待 worker activation。
- `src/webtorrent/sourceParser.ts`：校验 magnet URI 和 `.torrent` 文件；支持 `btih` / `btmh`，限制 torrent 文件最大 50 MB。
- `src/webtorrent/taskState.ts`：任务状态 reducer；`no-peers` 是可恢复错误，后续 stats 证明有 peer 或下载流量时清除。
- `src/lib/media.ts`：将 WebTorrent file 映射成 UI 文件项，识别可播放音视频，选择默认播放文件。
- `src/lib/storage.ts`：只在 `localStorage` 保存最近 magnet 输入；不上传来源。
- `src/components/*`：来源输入、播放器、文件列表、状态指标和诊断面板。

## 数据与状态边界

- React state 只保存可序列化 UI 状态；WebTorrent client、torrent、file 和 media element 留在 refs 内。
- 一个活动播放任务默认只选一个媒体文件；多任务队列不属于 V1。
- `AppError` 必须包含 `code`、用户可读 `message`、可选 `technicalDetail` 和 `recoveryAction`。
- `TaskStatus` 覆盖 `idle`、`validating`、`fetching-metadata`、`ready`、`buffering`、`playing`、`paused`、`no-peers`、`unsupported`、`error`、`stopped`。
- `noPeers` 事件不等于致命失败；如果后续 stats 显示 peer、下载速度、已下载字节或进度增长，状态应恢复并清除该错误。

## WebTorrent 集成

- 创建 client 时启用 `tracker` 和 `webSeeds`，关闭 `dht`、`lsd`、`utPex`，避免浏览器 V1 暗示普通 BT 客户端能力。
- 添加 torrent 时使用 `destroyStoreOnDestroy: true`、`strategy: 'sequential'`、`noPeersIntervalTime: 8`。
- 必须同时监听 `client.on('error')` 和 `torrent.on('error')`。
- 创建 runtime 前检查 WebRTC 与 Service Worker；Service Worker 失败时阻止播放并显示恢复动作。
- 停止任务、页面卸载或启动新任务前，应清理 timers、媒体元素、torrent refs、stream server 和 WebTorrent client。

## 存储与隐私

- 本地只保存最近输入列表：`torrent-player.recent-inputs.v1`。
- 不保存完整 torrent 数据、播放历史、infoHash 日志或远端分析事件。
- 不持久保存下载文件；如未来启用 File System Access API，必须先补权限、清理、隐私和测试设计。
- V1 不包含后端、数据库、账号、云同步、云端离线下载或远端转码。

## 界面实现约束

- UI 规则以 `docs/DESIGN.md` 为准。
- 当前视觉方向是“黑匣子信号甲板”：桌面端三栏工作台仍为来源/文件、播放器、状态/事件/诊断，但呈现为硬边仪表甲板、媒体监视器和信号读数轨。
- 桌面端使用固定甲板布局：页面锁定在视口内，来源列、播放器列和状态列各自处理内部滚动，避免事件流把整页拖成长页；移动端恢复自然整页滚动。
- 主状态面板只显示播放决策字段；上传、ratio、已下载、WebRTC/Service Worker 能力细节和 infoHash 放入诊断面板。
- 移动端单列工作台，长 magnet、长文件名和长诊断详情不得造成横向滚动。
- 播放器、输入、文件列表、状态面板是功能区域；不要改成资源站首页、海报墙或营销落地页。
- 图标使用 lucide-react；按钮仍需文本或可访问名称。
- 背景深度使用噪点、扫描线、硬边几何和层叠边框；不使用通用蓝紫科技渐变或装饰性光效。

## 验证方式

常规代码改动至少运行：

```bash
npm run lint
npm run test
npm run build
```

涉及 WebTorrent、Service Worker、播放器状态机、响应式布局或主流程时，升级到浏览器 L3 烟囱测试：

- 桌面 `1280x720` 或 `1440x900`：页面可见、三栏布局、无横向溢出。
- 移动 `390x844`：单列布局、长输入/错误/文件名无横向溢出。
- 非法 magnet：就地显示输入错误，不创建 client。
- 合法 WebTorrent 样例：Service Worker ready、metadata ready、文件列表出现、可播放文件挂到 media element。

当前截图证据：

- `artifacts/screenshots/desktop-1280.png`
- `artifacts/screenshots/desktop-1440.png`
- `artifacts/screenshots/desktop-scroll-bottom-1440.png`
- `artifacts/screenshots/mobile-390.png`
- `artifacts/screenshots/live-magnet-390.png`
- `artifacts/screenshots/live-big-buck-bunny-1440.png`

## 安全与依赖风险

- `npm audit --omit=dev --json` 当前报告 4 个 high，链路为 `webtorrent -> torrent-discovery -> bittorrent-tracker -> ip`， advisory 为 `ip SSRF improper categorization in isPublic`。
- npm 给出的 `fixAvailable` 是把 `webtorrent` 降到 `0.7.3`，属于破坏性降级且不适用于当前 3.x browser API，未执行。
- 发布公网前必须重新审计依赖、CSP、合规提示、tracker 策略和滥用风险。

## 重要边界

- 不把浏览器 WebTorrent 包装成完整普通 BT 客户端。
- 不提供内容搜索、侵权资源聚合、资源站适配、榜单或推荐。
- 不上传用户输入的 magnet URI、torrent 文件、infoHash 或播放历史。
- 不引入隐藏代理、P2P 桥接、后端下载或规避浏览器网络限制的能力。
- 不在未处理 WebTorrent client/torrent 错误和销毁路径时扩展主流程。

## 待确认 / 后续评审

- 如果 V2 需要普通 TCP/UDP peers、后台下载、文件持久保存或系统播放器集成，应单独评审 Electron/Tauri/Node bridge。
- 如果要公网部署，应单独补隐私政策、CSP、安全审计、版权合规和滥用防护。
- 如果要持久保存文件，应单独评审 File System Access API 权限、清理 UI 和用户可理解的恢复流程。
