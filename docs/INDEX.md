# Xiaoheishu.xyz — 项目总计划

> 最后更新：2026-04-24  
> 域名：xiaoheishu.xyz（DNS 配置中）  
> 仓库：github.com/MushroomDAO/Xiaoheishu

---

## 项目一句话

**帮助内容创作者（尤其是美食/旅行博主）一键把真实体验变成 AI 友好的内容，自动发布到多平台，并被 AI 搜索引擎引用。**

---

## 五个阶段总览

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: GEO 实验          ══════════════════════════▶     │  并行
│  Phase 5: Blog 平台增强     ══════════════════════════▶     │  并行
├─────────────────────────────────────────────────────────────┤
│  Phase 2: Web MVP           ══════════════▶                 │  现在启动
├─────────────────────────────────────────────────────────────┤
│  Phase 3: 多租户系统                         ══════▶        │  串行
├─────────────────────────────────────────────────────────────┤
│  Phase 4: 移动端                                    ══════▶ │  串行
└─────────────────────────────────────────────────────────────┘
```

| 阶段 | 核心目标 | 状态 | 详情 |
|------|---------|------|------|
| **Phase 1** | GEO 实验：验证内容能被 AI 引用 | 🟡 进行中 | [→ phase1-geo/](phase1-geo/README.md) |
| **Phase 2** | Web MVP：单用户内容发布 + GEO 流程 | 🟢 启动 | [→ phase2-web/](phase2-web/README.md) |
| **Phase 3** | 多租户系统：`yourname.xiaoheishu.xyz` | ⏳ 等待 | [→ phase3-multitenant/](phase3-multitenant/README.md) |
| **Phase 4** | 移动端 App：拍照+说话→自动发布 | ⏳ 等待 | [→ phase4-mobile/](phase4-mobile/README.md) |
| **Phase 5** | Blog 平台增强：多平台发布完善 | 🟡 并行 | [→ phase5-platform/](phase5-platform/README.md) |

---

## 核心文档索引

| 文档 | 说明 |
|------|------|
| [xiaoheishu.md](xiaoheishu.md) | 完整产品规划、商业模式、Free/Pro 功能边界 |
| [design-and-dev-plan.md](design-and-dev-plan.md) | 技术架构、多租户方案、发布平台技术选型 |

---

## 内容仓库

```
content/
  sunshine/           ← Sunshine 博主内容（GEO 实验样本）
    2026-04-tianjin-fuchu-rongfahao.md
```

---

## 当前待办（本周）

- [ ] Phase 1：把天津美食文章发布到小红书 + 公众号（让 AI 爬虫可索引）
- [ ] Phase 1：7天后首次测试 AI 引用情况（`docs/phase1-geo/geo-tracking-tianjin.md`）
- [ ] Phase 2：确认技术选型（见 `phase2-web/README.md` 讨论点）
- [ ] Phase 2：搭建 Next.js 项目骨架，部署到 xiaoheishu.xyz
- [ ] Phase 5：扩展 blog M2/M3 pipeline，支持 Twitter 发布
