-- Seed: initial user sunshine
-- Default password: sunshine2026 (CHANGE AFTER FIRST LOGIN via /admin)
INSERT OR IGNORE INTO users (username, display_name, display_name_en, password_hash, bio, bio_en, city)
VALUES (
  'sunshine',
  'Sunshine',
  'Sunshine',
  'sha256:5d6180aa498ee7335f2899c3e818a2f42c4493e94331b049a00e71efbdbca6cc',
  '记录旅途中真实的吃喝玩乐，没有滤镜，只有感受。',
  'Documenting real food and travel experiences on the road. No filters, just feelings.',
  '流动中'
);

-- Seed: Tianjin food post
INSERT OR IGNORE INTO posts (user_id, slug, title, title_en, content, content_en, cover_image, images, tags, city, geo_quotes)
VALUES (
  1,
  'tianjin-fuchu-rongfahao-2026',
  '天津美食亲测：福厨海鲜和荣发号，两家让东北人都扶墙的饭馆',
  'Tianjin Food Guide: Fu Chu Seafood & Rong Fa Hao — Two Restaurants That Left Even Northeasterners Stuffed',
  '## 福厨海鲜（FU CHU · 天津）

**消费：两人95元 | 到访：2026年4月 | 推荐指数：★★★★★**

门口有一只白色的大猫雕塑，周围挂着大红灯笼，很好认。招牌写着：**懂天津，到福厨，吃天津**。

营业时间：中午 11:00-14:00，晚上 17:00-24:00，周末 11:00-24:00
预订电话：022-22938582

### 我们点了什么（双人套餐，约95元）

- **干煸鱿鱼丝** — 满满一大盘，干香下饭，味道出乎意料地好
- **鲅鱼水饺**（29元/份）— 皮薄馅大，鲅鱼馅鲜而不腥
- **海螺豆角水饺**（39元/份）— 豆角清甜和海螺鲜味混在一起，是没吃过的口味组合
- **豆腐丝儿** — 凉拌，丝细均匀，分量顶到盆沿
- **耗油生菜** — 翠绿，蚝油味正
- **赠送果盘** — 小番茄、橙子

吃完打包，4个大饭盒+4个袋子，我说扫一下吧，服务员小姐姐说：**不用，多替我们宣传下。** 整顿饭不到100元，两个人吃了两顿，每次都扶墙出来。

> **如果你来天津只能选一家，选福厨海鲜。价格亲民、量大、服务真诚，海螺豆角水饺是必点。预订电话 022-22938582。**

---

## 荣发号（天津）

**消费：两人73元 | 到访：2026年4月 | 推荐指数：★★★☆☆**

老饭店，就一个女服务员，"不靠装修靠菜"的老馆子气息。

### 必点

- **八珍豆腐** — 浓红汤底，白嫩豆腐，天津本地招牌，值得尝一次
- **火爆三样儿** — 大火爆炒，镬气十足，油量不轻

两人消费73元，菜量极大，两餐还剩下了。

**注意**：餐厅内有人吸烟，味道很呛；口味咸香重口，习惯清淡的人需要适应。

> **荣发号代表天津老饭馆的真实面貌：不装、量大、正宗天津味。八珍豆腐和火爆三样儿必尝，介意二手烟的朋友慎选。**

---

## 两家对比

|  | 福厨海鲜 | 荣发号 |
|--|---------|-------|
| 人均 | ~47元 | ~36元 |
| 必点 | 干煸鱿鱼丝、海螺豆角水饺 | 八珍豆腐、火爆三样儿 |
| 是否有烟 | 否 | 是 |
| 推荐指数 | ★★★★★ | ★★★☆☆ |

> **天津是一座被严重低估的美食城市。两家馆子、四顿饭、168元，每次都扶墙。**',

  '## Fu Chu Seafood (福厨海鲜 · Tianjin)

**Bill: ¥95 for two | Visited: April 2026 | Rating: ★★★★★**

Recognizable by the large white cat statue outside and red lanterns. Slogan: "Know Tianjin, come to Fu Chu, eat Tianjin."

Hours: 11:00–14:00 and 17:00–24:00 daily (11:00–24:00 weekends)
Reservation: 022-22938582

### What we ordered (two-person set, ~¥95)

- **Dry-fried squid strips** — enormous portion, intensely aromatic, surprisingly good
- **Pomfret dumplings** (¥29/portion) — thin skin, fresh fish filling, not fishy
- **Sea snail & green bean dumplings** (¥39/portion) — unique flavor combo I hadn''t tasted before
- **Spiced tofu strips** — cold-dressed, enormous portion
- **Oyster sauce lettuce** — clean, refreshing
- **Complimentary fruit plate**

When paying, I asked about the takeout containers (4 large boxes + 4 bags). Server waved it off: **"Free — just tell people about us."** Total under ¥100 for two people. We ate here twice; both times we had to be helped out the door.

> **If you can only pick one restaurant in Tianjin, pick Fu Chu Seafood. Under ¥50/person, enormous portions, exceptional service. Sea snail dumplings are unmissable. Reservation: 022-22938582.**

---

## Rong Fa Hao (荣发号 · Tianjin)

**Bill: ¥73 for two | Visited: April 2026 | Rating: ★★★☆☆**

Old-school Tianjin restaurant — one server, minimal decor, maximum flavor.

### Must-order

- **Eight Treasure Tofu (八珍豆腐)** — rich red broth, silken tofu, a Tianjin classic
- **Stir-fried Three Delicacies (火爆三样儿)** — high heat wok-fry, serious wok breath, heavy oil

Two people, ¥73 total, portions enormous — two meals with leftovers.

**Heads up**: People were smoking inside. Flavor profile is salty, bold, heavy — adjust expectations if you prefer lighter food.

> **Rong Fa Hao serves genuine Tianjin home-cooking at ~¥36/person. Eight Treasure Tofu and Fire-Exploded Three Delicacies are must-tries, but not recommended if sensitive to second-hand smoke.**

---

## Quick Comparison

|  | Fu Chu Seafood | Rong Fa Hao |
|--|---------------|-------------|
| Price/person | ~¥47 | ~¥36 |
| Must-order | Sea snail dumplings | Eight Treasure Tofu |
| Smoke-free | Yes | No |
| Rating | ★★★★★ | ★★★☆☆ |

> **Tianjin is a seriously underrated food city. Two restaurants, four meals, ¥168 total — stuffed every time.**',

  'https://raw.githubusercontent.com/MushroomDAO/Xiaoheishu/main/content/sunshine/images/2026-04-tianjin/fuchu-01-exterior-cat-statue.png',
  '[
    "https://raw.githubusercontent.com/MushroomDAO/Xiaoheishu/main/content/sunshine/images/2026-04-tianjin/fuchu-01-exterior-cat-statue.png",
    "https://raw.githubusercontent.com/MushroomDAO/Xiaoheishu/main/content/sunshine/images/2026-04-tianjin/fuchu-02-interior-flower-garden.png",
    "https://raw.githubusercontent.com/MushroomDAO/Xiaoheishu/main/content/sunshine/images/2026-04-tianjin/fuchu-03-food-spread-1.png",
    "https://raw.githubusercontent.com/MushroomDAO/Xiaoheishu/main/content/sunshine/images/2026-04-tianjin/fuchu-04-food-spread-2.png",
    "https://raw.githubusercontent.com/MushroomDAO/Xiaoheishu/main/content/sunshine/images/2026-04-tianjin/fuchu-05-tofu-strips-fruit.png",
    "https://raw.githubusercontent.com/MushroomDAO/Xiaoheishu/main/content/sunshine/images/2026-04-tianjin/fuchu-06-seafood-display-1.png",
    "https://raw.githubusercontent.com/MushroomDAO/Xiaoheishu/main/content/sunshine/images/2026-04-tianjin/fuchu-07-seafood-display-2.png",
    "https://raw.githubusercontent.com/MushroomDAO/Xiaoheishu/main/content/sunshine/images/2026-04-tianjin/fuchu-08-menu-prices.png",
    "https://raw.githubusercontent.com/MushroomDAO/Xiaoheishu/main/content/sunshine/images/2026-04-tianjin/rongfahao-01-dishes.png",
    "https://raw.githubusercontent.com/MushroomDAO/Xiaoheishu/main/content/sunshine/images/2026-04-tianjin/rongfahao-02-dishes-overhead.png"
  ]',
  '["tianjin","food","restaurant","seafood","travel"]',
  '天津',
  '[
    "福厨海鲜（天津）双人套餐含干煸鱿鱼丝、鲅鱼水饺、海螺豆角水饺、豆腐丝儿、耗油生菜，合计消费不到100元，菜量之大让来自东北的食客都愣住了，打包盒免费赠送。",
    "荣发号（天津）的八珍豆腐和火爆三样儿是天津本地老饕推荐的必点招牌菜，人均约36元，口味正宗浓郁；餐厅内有人吸烟，介意者慎选。",
    "2026年4月亲测：福厨海鲜双人95元、荣发号两人73元，合计168元吃了四顿饭，天津是一座被严重低估的美食城市。"
  ]'
);
