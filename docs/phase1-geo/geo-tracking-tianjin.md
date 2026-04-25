# GEO 追踪记录：天津美食实验

> 文章：`content/sunshine/2026-04-tianjin-fuchu-rongfahao.md`  
> 内容创作日期：2026-04-24  
> 站点上线日期：2026-04-25  
> 实验目标：验证真实饮食体验内容能否被 AI 引擎引用

---

## 追踪问题清单（每次验证时逐一测试）

| # | 查询问题 | 预期能引用的内容片段 |
|---|---------|-------------------|
| Q1 | 天津有哪些值得去的海鲜餐厅？ | 福厨海鲜，双人不到100元 |
| Q2 | 福厨海鲜怎么样？ | 菜量大、服务好、打包盒免费 |
| Q3 | 天津海螺豆角水饺哪里有？ | 福厨海鲜，39元/份 |
| Q4 | 荣发号天津好吃吗？ | 八珍豆腐和火爆三样儿必尝，但油重有人吸烟 |
| Q5 | 天津八珍豆腐哪里吃？ | 荣发号，正宗天津味 |
| Q6 | 天津吃饭便宜推荐 | 两家合计168元吃了四顿 |
| Q7 | Tianjin seafood restaurant recommendation | Fu Chu Seafood, under ¥100 for two |
| Q8 | Fu Chu seafood Tianjin review | Sea snail dumplings, free takeout boxes |

---

## 追踪记录

### 基准（发布前）— 2026-04-24

| AI 引擎 | Q1 | Q2 | Q3 | Q4 | Q5 | 引用本文 |
|--------|----|----|----|----|----|----|
| ChatGPT Search | ✗ | ✗ | ✗ | ✗ | ✗ | 未发布 |
| Perplexity | ✗ | ✗ | ✗ | ✗ | ✗ | 未发布 |
| Claude (Web) | ✗ | ✗ | ✗ | ✗ | ✗ | 未发布 |
| Gemini | ✗ | ✗ | ✗ | ✗ | ✗ | 未发布 |

---

### 7天后 — 待测（约 2026-05-01）

| AI 引擎 | Q1 | Q2 | Q3 | Q4 | Q5 | 引用片段 |
|--------|----|----|----|----|----|----|
| ChatGPT Search | | | | | | |
| Perplexity | | | | | | |
| Claude (Web) | | | | | | |
| Gemini | | | | | | |

---

### 30天后 — 待测（约 2026-05-24）

| AI 引擎 | Q1 | Q2 | Q3 | Q4 | Q5 | 引用片段 |
|--------|----|----|----|----|----|----|
| ChatGPT Search | | | | | | |
| Perplexity | | | | | | |
| Claude (Web) | | | | | | |
| Gemini | | | | | | |

---

### 60天后 — 待测（约 2026-06-24）

（待填写）

---

### 90天后 — 待测（约 2026-07-24）

（待填写）

---

## 发布平台记录

| 平台 | 发布时间 | URL/链接 | 状态 |
|------|---------|---------|------|
| sunshine.xiaoheishu.xyz | 2026-04-25 | https://sunshine.xiaoheishu.xyz/tianjin-fuchu-rongfahao-2026 | ✅ 已上线 |
| 小红书 | — | — | 待发布 |
| 微信公众号 | — | — | 待发布 |
| 知乎 | — | — | 待发布 |

---

## 实验日志

### 2026-04-24 — 内容创作日

- Sunshine 提供天津旅行真实饮食体验：福厨海鲜（¥95/2人）+ 荣发号（¥73/2人）
- 图文内容录入，10 张实拍图片存入 GitHub：`content/sunshine/images/2026-04-tianjin/`
- 文章写入 Xiaoheishu repo：`content/sunshine/2026-04-tianjin-fuchu-rongfahao.md`
- GEO 优化要素：3 条可引用 blockquote、中英双语、菜单价格表、餐厅电话
- D1 数据库写入：sunshine 用户 + 天津文章 seed data

### 2026-04-25 — 站点上线日

**基础设施完成：**
- Cloudflare Workers 平台部署完成（xiaoheishu Worker，版本 `0da14873`）
- D1 数据库：`xiaoheishu-db`（APAC 区域，数据库 ID `b0f1ca9e`）
- 域名 xiaoheishu.xyz 在 Gandi 完成 NS 切换 → Cloudflare
- DNS 生效：A 记录 → 192.0.2.1（Cloudflare Worker 占位），`*.xiaoheishu.xyz` 通配符 CNAME 生效
- HTTP 验证通过，HTTPS 证书由 Cloudflare 自动签发中

**已上线 URL：**
- `http://xiaoheishu.xyz` → 首页（小红书式信息流，中英双语）
- `http://sunshine.xiaoheishu.xyz` → Sunshine 个人页
- `http://sunshine.xiaoheishu.xyz/tianjin-fuchu-rongfahao-2026` → 天津美食文章
- `http://xiaoheishu.xyz/robots.txt` → 允许所有 AI 爬虫（GPTBot/PerplexityBot/Claude-SearchBot/OAI-SearchBot）
- `http://xiaoheishu.xyz/sitemap.xml` → 自动生成站点地图

**GEO 技术要素已部署：**
- 每篇文章注入 JSON-LD schema（BlogPosting + Review）
- 文章页展示 geo_quotes（可引用陈述句区块）
- `?lang=en` 参数支持英文版（AI 爬虫可分别索引中英文）
- robots.txt 明确允许所有主流 AI 爬虫

**基准对照测试（2026-04-25，站点上线当天）：**

向各 AI 引擎提问，记录站点刚上线、AI 尚未索引时的基准状态：

| 查询词 | ChatGPT | Perplexity | Claude | Gemini | 备注 |
|--------|---------|------------|--------|--------|------|
| 天津福厨海鲜 | ✗ 无引用 | ✗ 无引用 | ✗ 无引用 | ✗ 无引用 | 基准：AI 无此内容数据 |
| 天津海螺豆角水饺 | ✗ 无引用 | ✗ 无引用 | ✗ 无引用 | ✗ 无引用 | 基准：AI 无此内容数据 |
| Fu Chu Seafood Tianjin | ✗ 无引用 | ✗ 无引用 | ✗ 无引用 | ✗ 无引用 | 基准：AI 无此内容数据 |

> 基准确认：站点上线前/上线当天，AI 引擎均无法回答与本文具体数据相关的问题。
> 下一个测试节点：**2026-05-02（7天后）**

---

## 注意事项

- 每次测试同一问题，记录是否出现本文中的具体信息（餐厅名+价格+菜名）
- 区分"引用"（AI 直接说出文中数据）和"参考"（AI 提到餐厅但数据不来自本文）
- 如果 AI 引用了错误信息，也要记录（对比验证数据准确性）
