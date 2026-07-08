# AGENTS.md

## 项目角色

本项目是基于 WebTorrent 的磁力播放器。开发 Agent 必须先按 Harness 文档理解产品、架构、设计和当前交接状态，再进入实现。

## 开始前必须阅读

每次修改代码前，先阅读：

1. `docs/PRODUCT.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DESIGN.md`
4. `session-handoff.md`

如果用户最新明确需求与 Harness 文档冲突，以用户最新明确需求为准，并同步更新相关 Harness 文档。

## 工作原则

- 一次只处理一个明确目标，保持手术式最小改动。
- 不擅自扩大产品范围，尤其不加入内容搜索、盗版资源站聚合、账号系统、云端下载、转码服务或规避网络限制的能力。
- 本项目只服务用户自有或合法授权内容的播放、学习和技术验证；不得把产品做成侵权内容发现、传播或获利工具。
- 需求不明确时，先判断缺口是否会改变产品范围、平台支持、网络能力、安全边界、存储策略或设计方向；会改变时先问最多 3 个必要问题，不会改变时用保守假设推进并写入待确认。
- 修复缺陷时先判断是否属于同类问题；若根因来自共享输入、格式契约、配置源、helper、WebTorrent 封装、播放器状态机或 UI primitive，横向检查同一数据流并补合成边界值验证。
- 对有界面的改动，遵守 `docs/DESIGN.md`；不交付粗糙、拥挤、模板化或明显平庸的界面。
- 涉及产品范围变化时，更新 `docs/PRODUCT.md`。
- 涉及技术栈、目录、WebTorrent 集成、Service Worker、状态模型、存储、构建或验证方式变化时，更新 `docs/ARCHITECTURE.md`。
- 涉及界面、视觉、交互、动效、响应式或可访问性变化时，更新 `docs/DESIGN.md`。
- 每轮开发结束后，更新 `session-handoff.md`。
- 编辑已有文件前先读取；未经用户明确要求，不 commit、push 或发布。
- 不执行破坏性命令，除非用户明确确认。

## 完成标准

只有满足以下条件，才能说明任务完成：

- 目标功能或文档改动已完成，且没有超出当前范围。
- 已按 `docs/ARCHITECTURE.md` 的验证分层选择并运行相关验证，或明确说明跳过原因与剩余风险。
- 主流程涉及 UI 时，已检查目标桌面和移动视口；文字不重叠，布局不破碎，交互状态清楚。
- 产品、架构、设计文档已按影响范围同步更新。
- `session-handoff.md` 已记录已完成、未验证、风险和下一步。

## 项目特定规则

- 浏览器 V1 默认只支持 WebTorrent/WebRTC peer 与 Web Seed；不要承诺能直接连接普通 BitTorrent TCP/UDP peer。
- 播放主路径围绕用户输入 magnet URI 或导入 `.torrent` 文件展开；不要内置搜索、榜单、影视分类或来源推荐。
- 播放器必须显式处理无 WebRTC、无 peers、metadata 获取失败、无可播放媒体、浏览器不支持编码、Service Worker 注册失败和用户停止下载等失败路径。
- WebTorrent client、torrent、file、player UI 状态必须有清晰生命周期；退出页面或移除任务时要释放连接、对象 URL、Service Worker server 和临时 store。
- 本项目是本地优先 Web 应用；没有明确需求前不引入后端、数据库、登录、支付或远端任务队列。
