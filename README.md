# work-beep-plugin-sdk

blenderBeeper 的插件 SDK 仓库，对外只发一个包 `@beep/sdk`：

- **契约**（`src/`）——插件与 Host 之间的唯一契约：`definePlugin` / `PluginContext` / `CTX_KEY` / `PluginTool`。故意做薄：只有类型与恒等函数，实现全在 Host。
- **构建预设与打包命令**（`kit.mjs` + `cli.mjs`）——插件 `pnpm add @beep/sdk` 后直接用
  `beep-plugin build` 打包：单文件 ESM 产物 + `vue`/`@beep/sdk` 全局化改写 + 复制 `plugin.json`/`assets/`。
  构建预设也可经 `@beep/sdk/kit` 子路径 import（`definePluginBuild()`，自定义 vite 流程时用）。
- `example/`——插件开发与调试指南（含打包好的主程序下载脚本，拉到即可调试，免构主项目）。

## 构建

```bash
pnpm install && pnpm build   # tsc 出 dist/（改了 src/index.ts 必跑，host/插件经 file: 引用 dist）
```

本地联调：与 work-beep（Host）、work-beep-plugin-blender 三仓并列，经 `file:` 依赖引用。
