# 食光智语 — 小程序设计方案

> 面向学生群体的饮食记录与热量管理小程序，强调操作简单、热量自动计算、智能体辅助。

---

## 一、产品定位与用户画像

| 维度 | 说明 |
|------|------|
| 目标用户 | 关注饮食健康、需控制热量的在校学生 |
| 核心痛点 | 传统记录繁琐、热量需查表手算、缺乏个性化建议 |
| 产品价值 | 一键记录（手输/拍照/语音）+ 自动算热量 + 达标提示 + 智能建议 |
| 设计原则 | 3 步内完成一餐记录；首页一眼看懂今日热量；少表单、多默认 |

---

## 二、信息架构与页面结构

### 2.1 底部 Tab 导航（4 个主入口）

```
┌─────────┬─────────┬─────────┬─────────┐
│  今日   │  记录   │  统计   │  我的   │
│ (首页)  │         │         │         │
└─────────┴─────────┴─────────┴─────────┘
```

| Tab | 页面路径 | 职责 |
|-----|----------|------|
| 今日 | `pages/home/home` | 今日总热量、达标环、各餐摘要、智能建议卡片 |
| 记录 | `pages/record/record` | 添加/编辑饮食（手输、拍照、语音三入口） |
| 统计 | `pages/stats/stats` | 日/周柱状图、趋势简述 |
| 我的 | `pages/profile/profile` | 身高体重、偏好、热量目标、关于 |

### 2.2 子页面（非 Tab）

| 页面 | 路径 | 说明 |
|------|------|------|
| 记录详情/编辑 | `pages/record-edit/record-edit` | 单条记录的增删改 |
| 拍照识别 | `pages/camera/camera` | 取景 → 上传 → 回填食物名 |
| 语音记录 | `pages/voice/voice` | 三按钮录音流程 |
| 建议详情 | `pages/advice/advice` | 历史智能体建议列表 |

### 2.3 目录结构（建议）

```
食光智语/
├── app.js / app.json / app.wxss
├── config/
│   └── api.js              # 后端 baseURL、接口路径
├── utils/
│   ├── request.js          # 统一请求封装
│   ├── date.js             # 日期格式化
│   └── calorie.js          # 前端展示用热量计算辅助
├── components/
│   ├── meal-tabs/          # 早/中/晚/加餐切换
│   ├── calorie-ring/       # 环形达标进度
│   ├── food-card/          # 单条食物卡片
│   └── chart-bar/          # 简易柱状图（canvas）
├── pages/
│   ├── home/
│   ├── record/
│   ├── record-edit/
│   ├── camera/
│   ├── voice/
│   ├── stats/
│   ├── profile/
│   └── advice/
└── server/                 # 后端（见第六节）
    ├── ...
```

---

## 三、核心功能设计

### 3.1 饮食记录（手动）

**流程：** 记录 Tab → 选择餐次 → 输入食物名 + 食用量（克/份/碗）→ 保存 → 自动算热量并刷新首页。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 服务端生成 UUID |
| userId | string | 微信 openId |
| date | string | `YYYY-MM-DD` |
| mealType | enum | `breakfast` \| `lunch` \| `dinner` \| `snack` |
| foodName | string | 食物名称 |
| amount | number | 食用量数值 |
| unit | string | `g` \| `份` \| `碗` \| `个`（下拉） |
| calories | number | 服务端/智能体计算后写入 |
| source | enum | `manual` \| `photo` \| `voice` |
| createdAt / updatedAt | datetime | |

**交互：**
- 列表按餐次分组展示，左滑或长按弹出「编辑 / 删除」
- 编辑复用 `record-edit` 页，提交 `PUT /api/records/:id`
- 删除 `DELETE /api/records/:id`，本地列表乐观更新

### 3.2 拍照识别

**流程：**

```
点击拍照 → wx.chooseMedia / camera 组件
    → 压缩图片 (max 1280px)
    → POST /api/food/recognize (multipart)
    → 返回 foodName + 可选候选列表
    → 跳转 record-edit 预填名称，用户补食用量 → 保存
```

**权限：** `scope.camera`、`scope.album`；首次引导说明用途。

**失败兜底：** 识别失败时提示「改用手动输入」，不阻断记录。

### 3.3 语音辅助

**三按钮状态机：**

| 按钮 | 状态 | 行为 |
|------|------|------|
| 开始录音 | idle | `RecorderManager.start()`，切换 recording |
| 结束录音 | recording | `stop()`，得到 tempFilePath，切换 recognizing |
| 识别 | recognizing | 上传 → 百度 ASR → 解析文本 → 预填表单 |

**解析规则（后端）：** 智能体或规则从文本提取 `{ foodName, amount?, unit?, mealType? }`，例如「中午吃了一碗米饭」→ lunch + 米饭 + 1碗。

### 3.4 热量展示

**首页卡片：**

```
今日已摄入  1280 kcal
目标        1800 kcal
━━━━━━━━━━●━━━━  71%  「还可摄入 520 kcal」
```

- **单条热量：** 记录列表每项右侧显示 `xxx kcal`
- **达标逻辑：**
  - `intake < target * 0.9` → 绿色「未达标，可适量加餐」
  - `0.9 ≤ intake ≤ 1.1` → 蓝色「今日均衡」
  - `intake > target * 1.1` → 橙色「已超标，注意控制」

**目标来源：** 个人设置中的 `dailyCalorieTarget`，默认由智能体根据身高体重活动量推荐，用户可手动覆盖。

### 3.5 个人设置

| 字段 | 说明 |
|------|------|
| height | cm |
| weight | kg |
| age / gender | 可选，用于 BMR 估算 |
| activityLevel | 久坐 / 轻度 / 中度运动 |
| preferences | 文本：素食、低碳、不吃辣等 |
| dailyCalorieTarget | 千卡，可「一键推荐」再手调 |

保存 → `PUT /api/user/profile`，并触发可选的「重新生成建议」任务。

### 3.6 数据统计

- **日视图：** 当日各餐热量堆叠或总柱一条
- **周视图：** 7 根柱，X 轴 Mon–Sun，Y 轴 kcal
- 数据来自 `GET /api/stats?type=day|week&date=`
- 图表：`canvas 2d` 自绘简易柱图（避免重依赖）；或使用 `echarts-for-weixin`（可选）

### 3.7 饮食建议（智能体）

- **触发：** 每日首次打开首页、保存个人信息后、每周一早晨
- **展示：** 首页顶部卡片 2–3 句，点击查看 `advice` 历史
- **内容约束：** 简短、可执行、无医疗诊断措辞（合规提示）

---

## 四、前端关键交互（小白友好）

1. **默认餐次：** 根据当前时间自动选中（6–10 早、10–14 中、17–21 晚，其余加餐）
2. **食用量：** 提供常用快捷按钮（半碗、一碗、100g、200g）
3. **空状态：** 无记录时显示插画 +「拍一张试试」主按钮
4. **加载态：** 识别/语音过程全屏 loading + 文案「正在识别…」
5. **离线：** 记录先写本地队列，网络恢复后同步（二期可选）

---

## 五、后端 API 设计

**Base URL：** `https://your-domain.com/api`  
**鉴权：** 小程序 `wx.login` → `code` 换 `session` → 请求头 `Authorization: Bearer <token>`

### 5.1 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/login` | body: `{ code }` → `{ token, openId }` |

### 5.2 饮食记录

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/records` | query: `date`, `mealType?` |
| POST | `/records` | 创建记录（含 source） |
| PUT | `/records/:id` | 更新 |
| DELETE | `/records/:id` | 删除 |
| GET | `/records/summary` | query: `date` → 各餐 + 总热量 |

### 5.3 多媒体识别

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/food/recognize` | `multipart/form-data` 图片 → `{ foodName, candidates[] }` |
| POST | `/voice/recognize` | `multipart` 音频 → `{ text, parsed: { foodName, amount, unit, mealType } }` |

### 5.4 热量与智能体

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/calorie/estimate` | `{ foodName, amount, unit }` → `{ calories, detail? }` |
| GET | `/advice/latest` | 最新一条建议 |
| GET | `/advice` | 历史列表 |
| POST | `/advice/generate` | 手动刷新建议（限流） |

### 5.5 用户与统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/user/profile` | |
| PUT | `/user/profile` | |
| POST | `/user/target/recommend` | 根据身体数据推荐热量目标 |
| GET | `/stats` | query: `type=day\|week`, `date` → 图表数据 |

### 5.6 统一响应格式

```json
{
  "code": 0,
  "message": "ok",
  "data": { }
}
```

错误码示例：`40001` 参数错误，`40101` 未登录，`42901` 请求过频，`50001` 第三方 API 失败。

---

## 六、后端架构

### 6.1 技术选型（推荐）

| 层级 | 选型 | 理由 |
|------|------|------|
| 运行时 | Node.js + Express / Koa，或 Python FastAPI | 与小程序团队技能匹配、部署简单 |
| 数据库 | MySQL / PostgreSQL | 结构化记录 + 用户资料 |
| 缓存 | Redis | 会话、限流、建议缓存 24h |
| 对象存储 | 腾讯云 COS / 阿里云 OSS | 图片、录音临时文件 |
| 部署 | 云函数 SCF + API 网关，或单机 Docker | 学生项目可先用单机 |

### 6.2 服务模块

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  API Gateway │────▶│ 业务服务      │────▶│ MySQL        │
│  + 鉴权      │     │ Record/User  │     │ Redis        │
└──────────────┘     │ Stats        │     └──────────────┘
                     └──────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
 │ 食物识别API  │   │ 百度语音识别 │   │ 智能体 API   │
 │ (腾讯/百度/  │   │             │   │ (热量+建议)  │
 │  自建)       │   │             │   │             │
 └─────────────┘   └─────────────┘   └─────────────┘
```

### 6.3 数据处理流程

**拍照：**
1. 接收图片 → 转 JPG/WebP，限制 2MB
2. 上传 OSS，拿 URL
3. 调食物识别 API → 标准食物名
4. 返回前端；保存记录时再调热量估算

**录音：**
1. 接收 audio（aac/mp3）→ 转 16k PCM（百度要求）
2. 百度 ASR → 文本
3. 智能体 `parseMealText(text)` → 结构化字段
4. 返回 parsed + 原始 text

**热量计算：**
1. 优先查本地食物热量表（常见 500 种食材）
2. 未命中则智能体：`根据 {foodName, amount, unit} 估算千卡，只返回数字`
3. 写入 `records.calories`，累加 `daily_summary`（可 Redis 缓存 + 定时落库）

**统计：**
- 日：`SELECT meal_type, SUM(calories) GROUP BY meal_type WHERE date=?`
- 周：按 date 分组 SUM，填充缺失日为 0

### 6.4 数据库表（核心）

**users**
- id, open_id, nickname, avatar, height, weight, gender, activity_level, preferences, daily_calorie_target, created_at

**diet_records**
- id, user_id, record_date, meal_type, food_name, amount, unit, calories, source, image_url?, voice_text?, created_at, updated_at

**diet_advices**
- id, user_id, content, advice_date, created_at

**food_calorie_cache**（可选）
- food_name, unit, calories_per_unit

---

## 七、第三方接口集成要点

### 7.1 食物识别 API

| 方案 | 说明 |
|------|------|
| 腾讯云 图像识别 / 菜品识别 | 国内延迟低，有免费额度 |
| 百度 AI 菜品识别 | 与语音同平台，密钥统一 |
| 通义/文心 + 视觉 | 识别率依赖 prompt，成本按 token |

**接口封装：** `FoodRecognizer.recognize(buffer) → { name, confidence, alternatives }`

### 7.2 百度语音识别

- 产品：短语音识别标准版
- 流程：获取 `access_token` → POST 音频 base64
- 注意：录音格式转换、时长 ≤ 60s

### 7.3 智能体接口

**职责拆分：**

| 任务 | Prompt 要点 | 输出 |
|------|-------------|------|
| 热量估算 | 给定食物+份量，返回 JSON `{ calories: number }` | 结构化 |
| 文本解析 | 从口语提取餐次、食物、份量 | JSON |
| 饮食建议 | 结合今日摄入、目标、偏好、近 7 天均值 | 2–3 句中文 |
| 目标推荐 | 身高体重活动量 → Mifflin-St Jeor + 活动系数 | 整数 kcal |

**限流：** 每用户每日建议生成 ≤ 5 次；热量估算可缓存相同 `(foodName, amount, unit)` 24h。

**密钥：** 全部放服务端环境变量，禁止写入小程序前端。

---

## 八、安全与合规

- 隐私政策：说明收集身高体重、饮食数据用途
- 图片/录音：仅存 OSS 临时目录，7 天生命周期删除
- 健康免责：建议区标注「仅供参考，不构成医疗建议」
- HTTPS 全链路；敏感接口防重放（timestamp + nonce 可选）

---

## 九、UI 视觉建议

| 元素 | 建议 |
|------|------|
| 主色 | 清新绿 `#4CAF50` 或暖橙 `#FF9800`（食欲但不刺眼） |
| 字体 | 系统默认，标题 32rpx，正文 28rpx |
| 首页 | 上大卡片（热量环）+ 下列表（各餐） |
| 记录页 | 顶部三图标：手输 \| 拍照 \| 语音 |
| 统计页 | 切换「日 / 周」segmented control |

---

## 十、开发阶段规划

| 阶段 | 周期 | 交付 |
|------|------|------|
| P0 | 1–2 周 | Tab 框架、手动记录 CRUD、本地/mock 热量、首页汇总 |
| P1 | 1–2 周 | 登录、后端 API、真实热量估算、个人设置 |
| P2 | 1 周 | 拍照识别 + 语音 + 百度 ASR |
| P3 | 1 周 | 统计图表、智能体建议、达标提示优化 |
| P4 | 持续 | 离线同步、食物库扩充、分享海报 |

---

## 十一、小程序配置清单

**app.json 需声明：**

```json
{
  "permission": {
    "scope.camera": { "desc": "用于拍摄食物照片识别" },
    "scope.record": { "desc": "用于语音记录饮食" }
  },
  "requiredPrivateInfos": ["chooseMedia", "getLocation"],
  "networkTimeout": { "request": 15000, "uploadFile": 30000 }
}
```

**服务器域名：** request 合法域名、uploadFile 合法域名、downloadFile（若用 CDN）。

---

## 十二、接口调用示例（前端伪代码）

```javascript
// utils/request.js
const request = (url, method, data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}${url}`,
      method,
      data,
      header: { Authorization: `Bearer ${getToken()}` },
      success: res => res.data.code === 0 ? resolve(res.data.data) : reject(res.data),
      fail: reject
    })
  })
}

// 保存一条手动记录
async function saveRecord(form) {
  const calories = await request('/calorie/estimate', 'POST', {
    foodName: form.foodName,
    amount: form.amount,
    unit: form.unit
  })
  return request('/records', 'POST', { ...form, calories: calories.calories, source: 'manual' })
}
```

---

## 十三、验收标准（与需求对照）

| 需求项 | 验收方式 |
|--------|----------|
| 分餐记录、改删 | 四类餐次各增删改一条通过 |
| 拍照识别 | 拍照后 5s 内显示食物名，可改可保存 |
| 热量展示 | 单条 + 日总 + 达标三色提示正确 |
| 个人设置 | 改目标后首页环即时更新 |
| 日/周统计 | 柱图与记录总和一致 |
| 饮食建议 | 首页可见，内容 ≤ 150 字 |
| 语音三按钮 | 录→停→识别，解析结果可保存 |
| 后端 | 各接口 Postman/真机联调通过 |

---

*文档版本：v1.0 | 项目名：食光智语*
