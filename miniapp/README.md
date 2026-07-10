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
