# session-handoff.md

## 当前状态

- V1 已实现为纯浏览器 WebTorrent 磁力播放器。
- UI 已按用户确认的“黑匣子信号甲板”概念图重设计：硬边面板、顶部能力状态甲板、左侧来源/文件轨、中央播放监视器、任务信息/操作面板和右侧状态/事件/诊断纵列。
- UI 已完成整体验收后的优化：移动端紧凑能力摘要、上下文任务操作、中文主状态、AA 对比度 token、44px 触控目标、表单/进度/诊断语义与临界宽度布局修复。
- 本轮浏览器验证使用 `http://127.0.0.1:5174/`；验证结束后不保留 dev server，需要时运行 `npm run dev -- --host 127.0.0.1 --port 5174`。
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
- [x] 收敛信息层级：顶部独占 WebRTC / Service Worker / Stream server 全局能力，右侧主状态仅保留来源、中文任务状态、进度、下载速度和连接节点；上传、Ratio、已下载和底层能力细节进入诊断。
- [x] 移动端顶部能力甲板改为单行 `N/3 已就绪` 摘要，390px 首屏可同时看到 Magnet 主要操作和 `.torrent` 导入入口。
- [x] 空闲、已停止和环境不支持状态不再显示“停止任务”；诊断按钮补齐 `aria-expanded` / `aria-controls`。
- [x] Magnet 校验补齐 `aria-invalid`、`aria-describedby`、`role="alert"`，文件导入补齐可见 `:focus-within` 焦点环，下载进度补齐 `progressbar` 数值语义。
- [x] 移动端按钮和图标操作提升到至少 44px；弱文本与占位文字 token 提升到 AA 对比度范围。
- [x] 真实媒体挂载后移除准星、扫描线和信号轴；空状态继续保留监视器视觉。
- [x] 三栏切换断点提前到 1220px，并修复 1190px 两栏网格隐式行压缩导致状态区与播放器重叠的问题。
- [x] 事件/诊断编号修正为 07/08，移除无功能齿轮假操作，选中文件改用完整内描边而非单侧强调条。
- [x] 更新 `docs/ARCHITECTURE.md`、`docs/DESIGN.md`、`docs/PRODUCT.md` 与本交接记录。

## 已验证

- [x] `npm run lint` 通过。
- [x] `npm run test` 通过：5 个测试文件、17 个测试。
- [x] `npm run build` 通过。
- [x] Browser/IAB 桌面 `1280x720`：三栏布局存在，`scrollWidth=clientWidth=1280`，无框架错误遮罩，无 console error/warn。
- [x] Browser/IAB 桌面 `1440x900`：概念图主构图完整可见，任务信息、任务操作和右侧事件区域进入同一屏。
- [x] Browser/IAB 桌面 `1440x900`：右侧状态列滚到底后，`documentScrollHeight=documentClientHeight=900`，页面本身不滚动，中间播放/任务区域保持可见，`scrollWidth=clientWidth=1440`。
- [x] Browser/IAB 桌面 `1440x900`：主状态不再显示上传、Ratio、已下载；展开诊断后可见上传速度、Ratio、已下载；无 console error/warn，`scrollWidth=clientWidth=1440`。
- [x] Browser/IAB 移动 `390x844`：单列布局存在，`scrollWidth=clientWidth=390`，顶部状态甲板、来源输入和播放器区域无横向溢出。
- [x] Browser/IAB 桌面 `1280x800`：三栏为 `328px / 560px / 328px`，工作区 `scrollWidth=clientWidth=1248`。
- [x] Browser/IAB 临界桌面 `1190x800`：切换为 `330px / 812px` 两栏；状态区从下一行 `top=936.77` 开始，晚于播放器 `bottom=920.77`，无重叠且工作区无横向溢出。
- [x] Browser/IAB 移动 `390x844`：顶部甲板高度约 `156.5px`，主要按钮 `top=482.8px`，`.torrent` 导入区 `top=594.8px`，两种来源入口均进入首屏；页面无横向溢出。
- [x] Browser/IAB 窄屏 `360x740`：品牌行 `scrollWidth=clientWidth`，主要按钮高度 `44px`，页面无横向溢出。
- [x] 非法 magnet：错误以 alert 暴露，输入为 `aria-invalid=true` 并正确关联错误 id；清空后语义状态复原。
- [x] `.torrent` 文件输入可通过键盘获得焦点，拖放区 `:focus-within` 焦点环可见。
- [x] 空状态不显示停止按钮，主状态不再出现原始 `idle` / `off`；展开诊断后编号连续到 08。
- [x] Impeccable detector 复检通过：无剩余界面反模式告警。
- [x] 非法 magnet：输入 `not a magnet` 后显示“这不是 magnet URI。”，不创建任务。
- [x] 合法 Sintel magnet 烟测：Stream server ready；14 秒内 peers 为 0，metadata 未就绪，进入 `no-peers` 可恢复诊断路径；停止任务后资源释放。
- [x] 合法 Big Buck Bunny 完整 magnet 烟测：1 秒内 metadata ready，3 个文件出现，自动选中 `Big Buck Bunny.mp4`，视频元素挂载，任务进入 `buffering`，Peers=1，下载约 `452 KB/s`；停止任务后资源释放。
- [x] 截图已更新：`artifacts/screenshots/desktop-1280.png`、`artifacts/screenshots/desktop-1440.png`、`artifacts/screenshots/desktop-scroll-bottom-1440.png`、`artifacts/screenshots/mobile-390.png`、`artifacts/screenshots/live-magnet-390.png`、`artifacts/screenshots/live-big-buck-bunny-1440.png`。

## 未验证

- [ ] 未验证真实用户本地 `.torrent` 文件导入路径，只由 parser 单元测试覆盖文件类型、大小和读取逻辑。
- [ ] 本轮未验证完整播放到画面开始播放；Big Buck Bunny 已验证到 metadata ready、文件选择、video 挂载和 buffering。
- [ ] 本轮 UI 优化未重新连接外部 P2P 样例；媒体挂载后的装饰移除由组件测试覆盖，真实播放仍沿用上一轮 Big Buck Bunny 烟测证据。
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
