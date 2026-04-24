# Phase 3: 多租户系统

> 目标：开放注册，任何人可以免费入驻，获得 `yourname.xiaoheishu.xyz`  
> 状态：⏳ 等待 Phase 2 完成  
> 前置条件：Phase 2 MVP 稳定运行 ≥ 4 周

---

## 核心功能

- **开放注册**：任何人可免费注册
- **子域名自动开通**：注册后自动获得 `yourname.xiaoheishu.xyz`
- **Free / Pro 分层**：见 [xiaoheishu.md](../xiaoheishu.md) 功能边界表
- **用户隔离**：每个用户的内容、图床、发布账号独立

---

## 动态子域名技术方案

### 推荐方案：Cloudflare Workers + Middleware 路由

```
*.xiaoheishu.xyz → Wildcard DNS → Cloudflare Workers
Workers 中间件：
  1. 解析 hostname → 提取 username
  2. 查 Supabase：username 是否存在？
  3. 返回对应用户的内容列表/文章页
```

**优点**：即时生效，无需为每个用户创建独立站点  
**实现**：Next.js 中间件 + `request.headers.get('host')` 路由

### 备选方案：每用户独立 Cloudflare Pages 项目

- 注册时调用 Cloudflare Pages API 创建项目
- 缺点：Pages 免费账户有项目数量限制（500个）

---

## Free vs Pro 功能边界

详见：[xiaoheishu.md](../xiaoheishu.md)

核心区别：
- Free：每日 1 篇，9 张图，子域名
- Pro：无限发布，重试，自定义域名，GEO 深度优化

---

## 风控考虑

- 小红书代发：单账号限频（每账号每小时 ≤ 3 篇）
- 公众号：每个用户需绑定自己的公众号（OAuth 授权）
- 内容审核：敏感词过滤（避免平台封号）

---

## 里程碑（Phase 2 完成后排期）

| 里程碑 | 交付 |
|--------|------|
| M1：用户系统 | 注册/登录/个人设置 |
| M2：子域名自动化 | 注册即开通 `yourname.xiaoheishu.xyz` |
| M3：Pro 付费 | Stripe / 微信支付集成 |
| M4：多账号发布 | 用户绑定自己的小红书/公众号 |
