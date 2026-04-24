# Phase 5: Blog 多平台发布增强

> 目标：扩展和完善现有 blog（mshroom.cv）的 AI 多平台发布能力  
> 状态：🟡 与 Phase 1 并行推进  
> 仓库：github.com/MushroomDAO/blog（`pipeline/` 目录）

---

## 背景

现有 blog 已有三条发布管道：
- **M1**：Astro 静态博客 → Cloudflare Pages
- **M2**：Markdown → 微信公众号草稿（Node.js + WeChat API）
- **M3**：内容优化 → 小红书（Python + Dockerized Go MCP 服务）

本阶段目标：在现有管道基础上扩展，同时这些能力可以被 Xiaoheishu 平台复用。

---

## 扩展方向

### 新增平台

| 平台 | 方案 | 优先级 |
|------|------|--------|
| Twitter/X | 官方 API v2（Basic 层，1500条/月免费） | 高 |
| 知乎 | 问答植入（Playwright 自动化） | 中 |
| 抖音图文 | Computer Use（无官方 API） | 低 |

### 现有管道改进

| 改进项 | 说明 |
|--------|------|
| 发布失败自动重试 | BullMQ 队列，失败后 3次重试 + 通知 |
| 统一发布状态面板 | 单一页面查看各平台发布状态 |
| 图床统一 | 所有平台图片统一走 Cloudflare R2，避免重复上传 |
| GEO 自动注入 | 发布前自动添加可引用句 + schema（已在 blog 实现，抽取为服务） |

### Computer Use 探索

对于无 API 平台，Computer Use 方案：
- **Anthropic Computer Use API**：截图 + 操作序列
- **适用场景**：抖音图文、快手图文（复杂 UI 操作）
- **风险**：UI 变动导致自动化失效，需要 fallback

---

## 与 Xiaoheishu 的关系

Phase 5 的产出会直接被 Phase 2/3 复用：

```
blog pipeline/
    ├── m2/index.js          → Xiaoheishu 公众号发布服务
    ├── pipeline/deploy/xiaohongshu-mcp/  → Xiaoheishu 小红书发布服务
    └── 新增 Twitter 发布模块  → Xiaoheishu Phase 3 支持 Twitter
```

---

## 当前待办

- [ ] Twitter 发布模块（`pipeline/m4/`，API v2）
- [ ] 发布状态追踪（统一日志 + 通知）
- [ ] M2/M3 稳定性：失败重试机制
- [ ] 抽取 GEO schema 注入为独立 npm 包（供 Xiaoheishu 复用）
