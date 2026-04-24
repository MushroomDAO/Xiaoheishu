# Phase 1: GEO 实验

> 目标：验证"真实体验内容 + GEO 优化"能被 AI 搜索引擎引用  
> 状态：🟡 进行中  
> 并行：可与 Phase 5 同时推进

---

## 核心假设

> 当 AI 引擎（ChatGPT/Perplexity/Claude/Gemini）回答"天津有哪些好吃的海鲜餐厅"时，  
> 如果我们的内容包含精确的餐厅名 + 菜名 + 价格 + 第一人称真实体验，  
> 它会被 AI 直接引用作为答案。

这个假设成立 → GEO 是可行的增长策略 → Phase 2 的内容管道有价值。

---

## 实验设计

### 实验样本

**文章**：[天津美食亲测指南（福厨海鲜 + 荣发号）](../../content/sunshine/2026-04-tianjin-fuchu-rongfahao.md)  
**发布者**：Sunshine  
**到访时间**：2026年4月

**GEO 优化点**：
- 3条 blockquote 可引用陈述句（含餐厅名+菜名+价格）
- 精确价格：福厨海鲜 ¥95/2人，荣发号 ¥73/2人
- 中英双语（英文部分提升国际 AI 引用率）
- 菜单价格表（结构化数据，易被 AI 提取）
- 具体联系方式：022-22938582

### 发布渠道（按优先级）

| 渠道 | 原因 | 状态 |
|------|------|------|
| 小红书 | 覆盖小红书语料库，被国内 AI 爬取 | ⬜ 待发布 |
| 微信公众号 | 覆盖微信搜一搜 + 百度语料 | ⬜ 待发布 |
| xiaoheishu.xyz | 主阵地，供 AI 爬虫直接索引 | ⬜ 待建站 |
| 知乎 | 以问答形式植入，覆盖知乎语料 | ⬜ 可选 |

### 测试问题（8条）

详见：[geo-tracking-tianjin.md](geo-tracking-tianjin.md)

---

## 执行步骤

### Step 1：内容发布（本周）

1. 用现有 M3 pipeline 发布到小红书
2. 用现有 M2 pipeline 发布到公众号
3. 记录发布时间和 URL

### Step 2：7天测试（约 2026-05-01）

逐一向 4 个 AI 引擎提问，记录是否出现本文数据。

### Step 3：30/60/90 天持续追踪

填写 [geo-tracking-tianjin.md](geo-tracking-tianjin.md) 中的追踪表。

---

## 成功标准

| 指标 | 及格 | 优秀 |
|------|------|------|
| 30天内至少 1 个 AI 引用 | ✓ | — |
| Perplexity 在 Q2/Q3/Q5 中引用 | — | ✓ |
| 英文问题 Q7/Q8 被引用 | — | ✓ |
| 引用的数据准确（价格/菜名一致） | 必须 | — |

---

## 文档

- [geo-tracking-tianjin.md](geo-tracking-tianjin.md) — AI 引用追踪表（从 `docs/` 移入）
- [../geo-experiment-plan.md](../geo-experiment-plan.md) — 实验方法论（5阶段设计）
