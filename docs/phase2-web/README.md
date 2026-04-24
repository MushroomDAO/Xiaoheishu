# Phase 2: Web MVP

> 目标：提供网页版内容发布流程，单用户持续提交内容 + 规范化 GEO 流程  
> 状态：🟢 启动  
> 前置条件：域名 xiaoheishu.xyz 配置完成

---

## 本阶段交付物

用户（当前是 Sunshine/Jason）能够：
1. 打开 xiaoheishu.xyz，登录
2. 写图文内容（Markdown 编辑器 + 拖拽上传图片）
3. 点击发布 → 自动同步到：小红书 + 公众号 + `sunshine.xiaoheishu.xyz`
4. 内容自动经过 GEO 流程（可引用句生成 + JSON-LD schema 注入）

---

## 技术选型（待确认）

### 选项 A：Next.js 15 + Supabase（推荐）

```
前端：     Next.js 15 App Router + Tailwind CSS
数据库：   Supabase (PostgreSQL + Auth + Storage)
图床：     Cloudflare R2
发布队列： Cloudflare Queues
托管：     Cloudflare Pages / Vercel
```

**优点**：生态成熟，Supabase 提供免费 Auth + 数据库  
**缺点**：对现有 Astro 技术栈有一定跳跃

### 选项 B：Astro + SQLite（轻量）

```
前端：     Astro 5 + 服务端渲染（SSR mode）
数据库：   Turso (libSQL / SQLite edge)
图床：     Cloudflare R2
托管：     Cloudflare Pages (with Workers)
```

**优点**：延续现有 blog 技术栈，学习成本低  
**缺点**：Astro SSR 不如 Next.js 生态成熟

### 建议

MVP 阶段选 **选项 A（Next.js + Supabase）**，原因：
- Auth 开箱即用，不用自己写
- 免费额度足够 MVP（500MB 数据库 + 1GB 存储）
- 未来多租户扩展更顺滑

---

## MVP 功能范围（第一个 Sprint，2 周）

### 必须有（MVP）

- [ ] 登录（邮箱 + 密码，后期加微信 OAuth）
- [ ] Markdown 编辑器（支持图片上传）
- [ ] 图床：上传到 Cloudflare R2，返回 CDN URL
- [ ] 个人主页：`sunshine.xiaoheishu.xyz` 展示文章列表
- [ ] 发布到小红书（复用 xiaohongshu-mcp 服务）
- [ ] 发布到微信公众号（复用 M2 pipeline）
- [ ] 发布状态追踪（成功/失败/重试）

### GEO 自动化（MVP 内嵌）

- [ ] 发布前调用 LLM 生成 3 条可引用 blockquote
- [ ] 自动注入 JSON-LD schema（BlogPosting/Review/LocalBusiness 按内容类型选择）
- [ ] 自动生成英文摘要（200字）

### 不做（Phase 3 再说）

- 用户注册（Phase 3 才开放多用户）
- 自定义域名绑定
- 付费系统

---

## 子域名方案（MVP 阶段）

MVP 期间只有一个用户（Sunshine），子域名手动配置：

```
sunshine.xiaoheishu.xyz → CNAME → xiaoheishu.pages.dev
```

Phase 3 再做动态子域名开通。

---

## 发布流程架构

```
用户提交内容（标题+正文+图片）
        ↓
后端 API（Next.js Route Handler）
        ↓
并行执行：
  ├── GEO 处理（LLM 生成可引用句 + schema）
  ├── 图片上传到 R2
  └── 保存到数据库
        ↓
发布队列（Cloudflare Queue / BullMQ）
  ├── Task A：更新个人子站（触发静态重建 or 数据库驱动）
  ├── Task B：发布到小红书（xiaohongshu-mcp）
  └── Task C：发布到公众号（M2 pipeline）
        ↓
结果回调 → 更新发布状态 → 通知用户
```

---

## 技术依赖（可复用现有 blog 资产）

| 能力 | 来源 | 复用方式 |
|------|------|---------|
| 小红书发布 | blog `pipeline/deploy/xiaohongshu-mcp` | API 调用（HTTP） |
| 公众号发布 | blog `pipeline/m2/index.js` | 抽取为独立服务 |
| GEO schema 注入 | blog `src/layouts/BlogPost.astro` 逻辑 | 抽取为 Node.js 函数 |
| 内容格式规范 | blog `CLAUDE.md` + `SKILL.md` | 复制规范文档 |

---

## 里程碑

| 里程碑 | 预计时间 | 交付 |
|--------|---------|------|
| M1：项目骨架 | Week 1 | Next.js + Supabase + R2 跑通，登录可用 |
| M2：编辑发布 | Week 2 | 写文章 → 发布到子站 + 小红书 |
| M3：GEO 集成 | Week 3 | 自动生成可引用句 + schema |
| M4：公众号 | Week 4 | 发布到公众号，状态追踪完整 |

---

## 待确认事项

1. 技术选型：Next.js + Supabase 还是 Astro + Turso？
2. 小红书发布：用户自己的账号还是平台代发？（影响 Cookie 管理策略）
3. GEO 模型：用 claude-haiku（便宜）还是 claude-sonnet（效果好）生成可引用句？
4. 第一版是否需要 CI/CD（还是手动部署）？
