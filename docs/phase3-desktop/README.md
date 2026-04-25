# Phase 3: Desktop App

> 目标：给现有 blog pipeline 加 GUI 壳，实现本地内容管理 + 多平台一键发布
> 平台优先级：macOS → Windows（Linux 用户自行 build）

---

## 技术栈

```
Electron（主框架）
├── TypeScript + React（UI）
├── better-sqlite3（本地内容存储）
├── Express（内嵌预览服务器，localhost:3000）
├── Playwright sidecar（小红书/知乎 CDP 自动化）
│     └── 连接用户已有 Chrome Profile（--remote-debugging-port=9222）
├── 复用 blog pipeline
│     ├── WeChat API（Node.js，已有实现）
│     ├── 小红书 MCP Go sidecar（已有实现）
│     └── xiaoheishu.xyz Workers API（新增）
└── electron-builder（打包 → .dmg / .msi）
```

---

## 核心设计原则

1. **本地优先**：所有内容存储在本地 SQLite，不强制上云
2. **复用现有 pipeline**：不重写已有的 WeChat / 小红书 发布逻辑，Electron 只是 GUI 层
3. **Chrome Profile 复用**：小红书发布通过 CDP 连接用户自己的 Chrome（已登录），规避反自动化检测
4. **macOS 先行**：第一版只保证 macOS，Windows 版后续跟进

---

## 目录结构

```
desktop/
├── package.json
├── electron/
│   ├── main.ts           ← Electron 主进程
│   ├── preload.ts        ← 安全桥接
│   └── publishers/
│       ├── wechat.ts     ← 复用 blog/pipeline/m2/
│       ├── xiaohongshu.ts← 复用 Go MCP sidecar
│       ├── xiaoheishu.ts ← Workers D1 REST API
│       └── twitter.ts    ← Twitter API v2
├── src/
│   ├── App.tsx           ← React 主界面
│   ├── pages/
│   │   ├── Editor.tsx    ← Markdown 编辑器
│   │   ├── Library.tsx   ← 内容库（本地 SQLite）
│   │   ├── Preview.tsx   ← 内嵌预览（iframe → Express）
│   │   └── Publish.tsx   ← 发布控制台（多平台状态）
│   └── components/
└── preview-server/
    └── index.ts          ← Express，复用 xiaoheishu.xyz 的 CSS/模板
```

---

## 发布平台对照

| 平台 | 接入方式 | 实现来源 | MVP |
|------|---------|---------|-----|
| xiaoheishu.xyz | REST API | Workers D1 新增 | ✅ |
| 微信公众号 | 官方 API | blog pipeline/m2 复用 | ✅ |
| 小红书 | Chrome CDP | Go MCP + Playwright | ✅ |
| Twitter/X | 官方 API v2 | 新增 | 可选 |
| 知乎 | Chrome CDP | Playwright | V2 |

---

## 小红书 CDP 发布流程

```bash
# 用户首次设置：以 debug 模式启动 Chrome
open -a "Google Chrome" --args --remote-debugging-port=9222

# App 内部：Playwright 连接用户 Profile
const browser = await chromium.connectOverCDP('http://localhost:9222')
# → 使用用户已登录的小红书 session，不触发风控
```

App 会引导用户完成一次性 Chrome 配置（写入 macOS 启动项），之后每次开机自动以 debug 模式启动 Chrome。

---

## MVP 里程碑

| 周次 | 交付物 |
|------|--------|
| Week 1 | Electron 骨架 + SQLite 内容库 + Markdown 编辑器 |
| Week 2 | 内嵌预览站（Express + xiaoheishu.xyz 样式）|
| Week 3 | 微信公众号发布（复用现有 API）|
| Week 4 | 小红书发布（Go MCP + CDP 集成）|
| Week 5 | xiaoheishu.xyz 发布 + 发布状态 UI |
| Week 6 | macOS .dmg 打包 + 安装引导 |

---

## 与 Mobile App 的关系（Phase 4）

Desktop App 前端（React）将通过 **Capacitor** 复用到 Mobile：
- 共享编辑器、内容库 UI 组件
- Mobile 端调用 native 摄像头/麦克风替代桌面文件选择
- CDP 发布（小红书/知乎）在 Mobile 不可用，其余平台完全支持
- 同一套 TypeScript 业务逻辑，两套运行时（Electron / Capacitor）
