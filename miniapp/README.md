# 常州 AI Club 微信小程序

微信原生小程序 + TypeScript。后端统一使用主站的 `/api/miniapp/*` 接口。

## 本地检查

```bash
npm install
npm run typecheck
```

使用微信开发者工具导入本目录。开发版默认请求 `http://localhost:3000`，体验版和正式版请求 `https://changzhouai.club`。

本地真机调试可在开发者工具控制台设置临时 API 地址：

```js
wx.setStorageSync("miniapp_api_base_url", "http://局域网地址:3000")
```

`project.private.config.json`、上传私钥和 AppSecret 不得提交到 Git。

## 体验版验收

```bash
npm run typecheck
cd ..
npm run miniapp:audit-accounts
npm run miniapp:verify-api
npm run miniapp:metrics
```

微信公众平台需要配置：

- request 合法域名：`https://changzhouai.club`
- uploadFile 合法域名：`https://changzhouai.club`
- downloadFile 合法域名：主站域名以及活动图片实际使用的 Supabase Storage 域名
- 用户隐私保护指引：说明昵称、头像、微信号、城市和社区资料的使用目的
- 订阅消息模板：配置活动名称、活动时间、活动地点三个字段

订阅消息服务端环境变量：

- `WECHAT_MINIAPP_REMINDER_TEMPLATE_ID`
- `WECHAT_MINIAPP_REMINDER_TITLE_KEY=thing4`
- `WECHAT_MINIAPP_REMINDER_TIME_KEY=date5`
- `WECHAT_MINIAPP_REMINDER_LOCATION_KEY=thing6`
- `WECHAT_MINIAPP_MESSAGE_STATE`，体验版使用 `trial`，正式版使用 `formal`
- `CRON_SECRET`，用于保护 `/api/cron/miniapp-event-reminders`

服务器定时任务建议每 10 分钟调用一次提醒接口：

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://changzhouai.club/api/cron/miniapp-event-reminders
```
