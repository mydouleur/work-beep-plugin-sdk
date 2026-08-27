# 插件开发与调试示例

## 调试回路

1. 下载打包好的主程序（免构主项目）：

   ```bash
   node scripts/fetch-host.mjs            # 默认拉 v0.1.0-dev，可传其他 tag
   ```

   产物为 `host-app/`（beep-host.exe + plugins/），来自 work-beep 的 GitHub Release，**不进版本库**。
2. 你的插件用 `@beep/plugin-kit` 构建（`vite build`），产物为
   `dist/plugin.js + plugin.json + assets/`。
3. 把产物整个拷进 `host-app/plugins/<你的插件id>/`，双击 `beep-host.exe`，
   右栏下拉选中你的插件即可调试——不用构建主项目。

## 插件包结构（构建产物）

```
dist/
├── plugin.js     # 单文件 ESM，default 导出 definePlugin(...) 的返回值
├── plugin.json   # 清单：id / name / version / entry / sdkVersion
└── assets/       # 资源（Python 桥、辅助程序等），经 ctx.resolveAsset() 取绝对路径
```

## 契约要点

- 入口 `src/plugin.ts`：`export default definePlugin({ id, name, view, tools, start, stop })`，
  类型来自 `@beep/sdk`。
- 能力只从 ctx 拿（`inject(CTX_KEY)`）：launch / kill / embed / syncRect / call /
  resolveAsset / rectOf / watchRect。**不要 import @tauri-apps/\***。
- 共享依赖约束：源码里 `vue` 和 `@beep/sdk` 只用**具名导入或命名空间导入**
  （构建期被改写为全局解构，与主程序共用同一份实例）。
- 工具名必须带 `插件id.` 前缀（如 `blender.view_front`），Host 注册时强制校验；
  描述写短——tool schema 是模型 token 大头。

参考实现：`../../plugin-blender/`。
