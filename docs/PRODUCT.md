# PRODUCT.md

## 产品名称

Torrent Player

## 产品简介

Torrent Player 是一个基于 WebTorrent 的本地优先磁力播放器。用户提供自有或合法授权内容的 magnet URI 或 `.torrent` 文件后，应用尽量边下边播可播放的音视频文件，并展示连接、下载、缓冲和文件选择状态。

第一版优先验证浏览器内流式播放体验，而不是做完整 BT 下载器、内容发现平台或云端离线下载服务。

## 目标用户

- 想在浏览器里验证 WebTorrent/WebRTC 流式播放能力的开发者和技术用户。
- 拥有合法 magnet 或 `.torrent` 来源，想快速预览其中音视频文件的个人用户。
- 需要观察 peers、速度、进度和文件列表等基础诊断信息的本地调试用户。

使用约束：

- 用户需要自行提供合法来源；产品不提供内容搜索、推荐、资源站聚合或版权规避能力。
- 浏览器版 WebTorrent 主要连接 WebRTC peers 和 Web Seed；普通 TCP/UDP BT peer 能力不作为 V1 承诺。
- 播放成功受 peers、tracker、WebRTC、浏览器解码能力和网络环境影响，产品必须清楚展示失败原因和可恢复动作。

## 体验与设计方向

- 设计来源：混合驱动。
- 设计母题：克制的流媒体调试工作台。
- 参考方向：Mux Data Real-time Monitoring 的暗色视频质量监控工作台、WebTorrent Desktop 的边下边播任务心智、Mux Player 的响应式播放器控件。
- 不采用方向：盗版资源站首页、影视海报墙、营销落地页、蓝紫科技大屏、装饰性卡片堆砌。

设计基线：

- 首屏直接服务“输入来源 -> 解析 metadata -> 选择文件 -> 播放”主流程。
- 播放区域是视觉中心，网络状态和文件列表作为辅助信息可扫描但不喧宾夺主。
- 状态语言面向普通用户，诊断细节渐进披露。
- 桌面端利用分栏承载来源/文件、播放器和状态诊断；移动端保持来源、文件、播放器、状态的单列流程。

## 核心问题

本产品优先解决：

- 用户有 magnet URI 或 `.torrent` 文件时，如何尽快知道其中是否有可播放媒体。
- 在下载未完成时，如何优先拉取播放所需片段并稳定接入浏览器 `<video>` / `<audio>`。
- 当无法播放时，如何区分是 peers、metadata、WebRTC、Service Worker、文件类型还是浏览器编码支持问题。

## V1 范围

第一版需要完成：

- 输入 magnet URI，并支持拖入或选择 `.torrent` 文件。
- 创建 WebTorrent client，添加 torrent，展示 metadata 获取、peers、速度、进度、ratio 和错误状态。
- 识别 torrent 文件列表，优先展示音视频文件，允许用户选择一个文件播放。
- 使用浏览器能力进行流式播放，支持基础播放控制、加载状态、错误状态和停止任务。
- 显示合法使用提醒、WebRTC 支持检测、Service Worker/stream server 状态和无 peers 提示。
- 保留本地最近输入历史或用户偏好时，只使用浏览器本地存储，不上传用户来源。

## 暂不支持

第一版不做：

- 内容搜索、影视资源聚合、榜单、推荐、资源站适配或自动寻找侵权内容。
- 用户账号、云同步、云端离线下载、远端转码、服务器代理下载。
- 普通 TCP/UDP BitTorrent peer 桥接；若未来需要，应作为桌面端或本地 Node bridge 的独立方案评审。
- 完整下载管理器能力，例如多任务队列、限速策略面板、文件持久保存目录管理、做种策略管理。
- DRM、字幕搜索、在线弹幕、媒体库、收藏夹和跨设备投屏。

## 主要用户流程

1. 用户打开应用，看到来源输入区、合法使用提示和 WebRTC/Service Worker 支持状态。
2. 用户粘贴 magnet URI 或导入 `.torrent` 文件。
3. 应用添加 torrent，展示 metadata 获取进度、peers 状态和可恢复错误。
4. metadata 可用后，用户从文件列表选择可播放媒体。
5. 应用启动流式播放，播放区显示缓冲、播放错误、当前文件、下载速度和进度。
6. 用户停止任务或关闭页面时，应用释放 WebTorrent 连接和临时资源。

## 关键数据

- TorrentSource：`kind`、`inputLabel`、`rawValue`、`addedAt`、`validationStatus`。
- TorrentTask：`id`、`infoHash`、`name`、`status`、`progress`、`downloadSpeed`、`uploadSpeed`、`numPeers`、`ratio`、`error`。
- TorrentFile：`path`、`name`、`size`、`mimeType`、`downloaded`、`progress`、`playableKind`、`selected`。
- PlaybackState：`filePath`、`mediaKind`、`status`、`currentTime`、`duration`、`buffering`、`error`。
- CapabilityState：`webrtcSupported`、`serviceWorkerSupported`、`streamServerReady`、`codecHint`。

状态值必须覆盖 `idle`、`validating`、`fetching-metadata`、`ready`、`buffering`、`playing`、`paused`、`no-peers`、`unsupported`、`error`、`stopped`。

## 成功标准

产品层面的完成标准：

- 用户可以从合法 magnet URI 或 `.torrent` 文件进入播放尝试，不需要账号或后端服务。
- metadata、文件列表、peers、速度、进度和播放错误可见且能被用户理解。
- 失败路径有明确文案和下一步动作，不把所有失败都归为“播放失败”。
- 停止任务或离开页面后，连接与临时资源能被释放。
- 桌面和移动视口下主流程可完成，界面层级清楚，无关键文本截断或控件重叠。

## 待确认

- 待确认问题：V2 是否需要 Electron/Tauri 桌面端；当前 V1 已按纯浏览器 Vite 应用实现；影响范围：普通 TCP/UDP peer、文件系统持久保存、后台任务和打包方式；建议确认方式：需要这些能力时单独评审。
- 待确认问题：是否需要保存下载数据跨会话继续播放；当前采用假设：V1 以临时播放为主，只保留最近输入和 UI 偏好；影响范围：存储权限、File System Access API、清理策略和隐私提示；建议确认方式：原型后根据真实使用场景决定。
- 待确认问题：是否面向公开部署；当前采用假设：先本地开发和个人自用，不做公网运营；影响范围：版权合规提示、隐私政策、CSP、tracker 策略和滥用防护；建议确认方式：确定发布渠道前单独评审。
