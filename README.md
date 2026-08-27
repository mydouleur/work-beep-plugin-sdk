# work-beep-plugin-sdk

blenderBeeper 的插件 SDK 仓库：

- `@beep/sdk`（`src/`）——插件与 Host 之间的唯一契约：`definePlugin` / `PluginContext` / `CTX_KEY` / `PluginTool`。故意做薄：只有类型与恒等函数，实现全在 Host。
- `@beep/plugin-kit`（`kit/`）——插件构建预设（vite）：单文件 ESM 产物 + `vue`/`@beep/sdk` 全局化改写 + 复制 `plugin.json`/`assets/`。
- `example/`——插件开发与调试指南（含打包好的主程序下载脚本，拉到即可调试，免构主项目）。

## 构建

```bash
pnpm install && pnpm build   # tsc 出 dist/
```

本地联调：与 work-beep（Host）、work-beep-plugin-blender 三仓并列，经 `file:` 依赖引用。
