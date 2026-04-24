# Xiaoheishu.xyz 设计与开发计划

> 版本：v0.1 — 2026-04-24  
> 状态：讨论稿，待确认后推进

---

## 一、产品定位与核心价值

**Xiaoheishu.xyz** 是一个面向内容创作者（美食博主、旅行博主、KOL）的多平台自动发布平台。

**核心价值主张**：
- 写一次，AI 帮你同步发布到小红书、公众号、Twitter、YouTube 等
- 每人获得专属子域名：`yourname.xiaoheishu.xyz`
- 内置 GEO 优化，让你的内容被 AI 搜索引擎引用
- 未来提供移动 App：拍照+说话+定位 → 自动整理为可发布的博客

---

## 二、用户旅程（MVP 阶段）

```
1. 注册 → 申请入驻（免费）
2. 获得 yourname.xiaoheishu.xyz 子域名
3. 图文编辑器（Web）：写内容 + 上传图片
4. 一键发布 → 自动同步到：
   - xiaoheishu.xyz/yourname 主站
   - 小红书
   - 微信公众号
5. 查看发布状态
```

---

## 三、技术架构（分阶段）

### Phase 1 — MVP Web（4-6 周）

```
前端：        Next.js 15 App Router + Tailwind CSS
数据库：      Supabase (PostgreSQL + Auth + Storage)
图床：        Cloudflare R2（S3 兼容）
静态托管：    Cloudflare Pages（多租户子域名）
发布队列：    Cloudflare Queues / BullMQ (Redis)
```

**核心功能**：
- [ ] 用户注册/登录（支持微信扫码 OAuth）
- [ ] 子域名自动开通（`yourname.xiaoheishu.xyz`）
- [ ] 图文编辑器（Markdown + 富文本双模，支持拖拽上传图片）
- [ ] 发布到小红书（Playwright 自动化 / MCP 服务复用）
- [ ] 发布到微信公众号（WeChat API，复用现有 M2 pipeline）
- [ ] 个人主页展示（`yourname.xiaoheishu.xyz`）

### Phase 2 — 稳定性 + Pro 功能（8-12 周）

- [ ] BullMQ 发布队列 + 失败自动重试（Pro）
- [ ] 自定义域名绑定（Pro）
- [ ] 图床扩容（CDN 加速，Pro 无限制）
- [ ] GEO 自动优化（LLM 生成可引用句 + JSON-LD schema）
- [ ] Twitter/X 发布集成
- [ ] 发布历史 + 失败追踪

### Phase 3 — 移动 App + AI（16-24 周）

- [ ] 移动 App（React Native 或 Flutter）
  - 拍照 → 自动整理为图文草稿
  - 语音备注 → 转文字 + 排版
  - 定位 → 自动填写地点信息
- [ ] Computer Use 集成（处理无 API 平台：抖音、快手图文）
- [ ] AI 写作助手（基于用户历史风格）
- [ ] GEO 月度报告（AI 引用追踪）

---

## 四、多租户子域名方案

### 方案 A：Cloudflare Pages + Custom Domains（推荐 MVP）

每个用户是一个独立的静态站点：
- 发布内容时触发 Cloudflare Pages 构建
- 子域名通过 Cloudflare DNS API 动态添加 CNAME
- 缺点：每次发布需要触发构建（约 30-60 秒延迟）

### 方案 B：单应用 + 动态路由

- 单个 Next.js 应用，通过 `hostname` 中间件路由到对应用户
- `yourname.xiaoheishu.xyz` → 查数据库 → 渲染对应用户内容
- 优点：即时更新，无构建延迟
- 推荐用于 Phase 2

**建议**：MVP 用方案 A（简单），Phase 2 切换到方案 B。

---

## 五、发布平台技术方案详情

| 平台 | 方案 | 限制 |
|------|------|------|
| 个人子站 | Astro/Next.js 静态生成 | 无 |
| 微信公众号 | 官方 API（草稿 + 发布） | 需认证公众号 |
| 小红书 | Playwright 自动化 + Cookie 池 | 反爬风险，需轮换 |
| Twitter/X | 官方 API v2（Basic 层） | 每月 1500 条免费 |
| YouTube | YouTube Data API v3 | 仅视频，图文不支持 |
| 抖音/快手 | Computer Use（无官方 API） | 稳定性风险 |

### 小红书风控策略

- Cookie 池：多账号 Cookie 轮换
- 频率限制：每账号每小时 ≤ 3 篇
- User-Agent 随机化
- 失败时降级为"待手动发布"队列，发送通知给用户

---

## 六、GEO 自动化服务

发布流程中自动注入 GEO 优化：

```
用户提交内容
    ↓
LLM 提取关键实体（餐厅/菜品/地点/价格/体验）
    ↓
生成 3-5 条可引用 blockquote 陈述句
    ↓
生成英文摘要（200-300字，提升国际 AI 引用率）
    ↓
注入 JSON-LD Schema：
  美食类 → Review + FoodEstablishment
  旅行类 → TravelAction + TouristAttraction
  通用类 → BlogPosting
    ↓
发布 + 提交 IndexNow（必应/Yandex 即时收录）
```

---

## 七、Free vs Pro 功能边界

| 功能 | Free | Pro (¥59/月) |
|------|------|-------------|
| 子域名 | yourname.xiaoheishu.xyz | + 绑定自有域名 |
| 每日发布 | 1 篇 | 无限制 |
| 图床 | 每篇 9 张，≤5MB | 无限 + CDN |
| 发布平台 | 小红书 + 公众号 + 子站 | + Twitter + 抖音（Beta） |
| 自动重试 | ✗ | ✓（3次） |
| GEO 优化 | 基础 schema | + 可引用句生成 + 英文摘要 |
| AI 引用追踪 | ✗ | 月度报告 |
| 优先队列 | 共享 | 独立 |

---

## 八、MVP 开发优先级（第一个 Sprint，2 周）

1. **用户系统**：注册 + 登录（邮箱 + 微信）
2. **子域名开通**：`yourname.xiaoheishu.xyz` 自动创建
3. **图文编辑器**：Markdown 编辑 + 图片上传（R2）
4. **个人主页**：`yourname.xiaoheishu.xyz` 展示文章列表
5. **发布到小红书**：复用现有 xiaohongshu-mcp 服务

第一个可 Demo 的里程碑：用户注册 → 写一篇美食博客 → 发布到小红书 + 个人子站。

---

## 九、讨论点

以下内容需要与 Jason 确认：

1. **技术栈**：前端用 Next.js 还是 Astro（更熟悉）？
2. **数据库**：Supabase 还是自建 PostgreSQL（控制成本）？
3. **小红书策略**：单账号代发 vs 用户自己绑定账号？
4. **MVP 范围**：Phase 1 是否包含 Twitter？
5. **Computer Use 时间线**：是否在 Phase 1 就做抖音，还是先做有 API 的平台？
6. **定价**：Pro ¥59/月 是否合适，还是分 Basic/Pro/Enterprise？
7. **GEO 报告**：是否作为独立付费功能？

---

## 十、相关文档

- `xiaoheishu.md` — 完整产品规划和商业模式
- `geo-experiment-plan.md` — 美食 GEO 实验设计
- 上游 blog 项目：`github.com/MushroomDAO/blog` 的 `pipeline/` 目录（M1/M2/M3 发布管道可复用）
