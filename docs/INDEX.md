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
| **Phase 1** | GEO 实验：验证真实内容能被 AI 引擎引用 | 🟡 进行中 | [→ phase1-geo/](phase1-geo/README.md) |
| **Phase 2** | Web 平台：xiaoheishu.xyz 多租户上线（Workers + D1）| ✅ 已上线 | [→ phase2-web/](phase2-web/README.md) |
| **Phase 3** | Desktop App：Electron GUI + 多平台一键发布 | 🔨 进行中 | [→ phase3-desktop/](phase3-desktop/README.md) |
| **Phase 4** | Mobile App：Capacitor，本地 AI 语音，拍照发布 | ⏳ 等待 | [→ phase4-mobile/](phase4-mobile/README.md) |
| **Phase 5** | Spores 协议：链上无许可分成机制 | ⏳ 等待 | [→ phase5-platform/](phase5-platform/README.md) |

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

## 当前待办

### Phase 1 GEO（并行进行）
- [ ] 天津文章发布到小红书（人类端扩散）
- [ ] 天津文章发布到公众号
- [ ] **2026-05-02**：首次 AI 引擎引用测试（见 `phase1-geo/geo-tracking-tianjin.md`）

### Phase 3 Desktop App（主线）
- [x] 技术选型：Electron + TypeScript + React + SQLite（macOS 先行）
- [ ] 初始化 `desktop/` 项目骨架
- [ ] 本地内容管理（SQLite + Markdown 编辑器）
- [ ] 内嵌预览站（Express + 复用 xiaoheishu.xyz 样式）
- [ ] 接入微信公众号发布（复用 blog pipeline）
- [ ] 接入小红书发布（复用 Go MCP + CDP）
- [ ] 接入 xiaoheishu.xyz 发布（Workers D1 API）
- [ ] macOS .dmg 打包发布
