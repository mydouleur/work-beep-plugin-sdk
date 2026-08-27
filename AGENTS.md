# AGENTS.md — work-beep-plugin-sdk（插件 SDK）

## 项目概览

blenderBeeper 三仓插件架构中的 **SDK 仓库**，对外只发一个 npm 包 `@beep/sdk`，含三块：

- **契约**（`src/index.ts`）——插件与 Host 之间的**唯一契约**：`definePlugin` /
  `PluginContext` / `CTX_KEY` / `PluginTool`。**故意做薄**：只有类型、恒等函数和注入键，
  全部能力（launch/embed/call……）由 Host（work-beep 仓库）实现，经 `PluginContext` 传导进插件。
- **构建预设**（`kit.mjs`，经 `@beep/sdk/kit` 子路径导出）——vite 预设：单文件 ESM 产物 +
  `vue`/`@beep/sdk` 全局化改写 + 复制 `plugin.json`/`assets/`。
- **打包命令**（`cli.mjs`，bin 名 `beep-plugin`）——插件 `pnpm add @beep/sdk` 后直接
  `beep-plugin build` / `beep-plugin dev`（watch）打包，定位类似 tauri CLI。

另有 `example/`：插件作者视角的开发调试指南（含 fetch-host.mjs，拉 Release 主程序免构 Host 调试）。

设计理念：**收窄模型的世界**——工具 schema 写短（token 大头），SDK 薄是刻意的，不要往
`src/index.ts` 里加实现。

## 目录结构

```
src/index.ts      # 契约全部内容（就这一个文件）
kit.mjs           # 构建预设 definePluginBuild()，产物约定 dist/plugin.js + plugin.json + assets/
cli.mjs           # beep-plugin CLI：build / dev(watch)，cwd 即插件根目录
example/README.md # 插件开发调试指南（改契约/构建行为时同步更新）
example/scripts/fetch-host.mjs  # 从 work-beep Release 拉主程序包到 host-app/
```

## 构建

```bash
pnpm install && pnpm build   # tsc → dist/
```

改了 `src/index.ts` **必须重跑 `pnpm build`**：Host 与插件经 `file:../work-beep-plugin-sdk`
引用的是 `dist/` 产物，不构建改动不生效。`kit.mjs` / `cli.mjs` 是纯源码引用，无需构建。

## 约定

- 代码注释与文档用中文；commit message 按 Conventional Commits、中文撰写。
- 契约改动是**三仓联动变更**：同步检查 work-beep（`src/stores/plugins.ts` 的 ctx 构造、
  `src/shims/init.ts`）与 work-beep-plugin-blender，并更新 `example/README.md`。
- 全局化改写的约束要守住：插件源码对 `vue` / `@beep/sdk` 只用**具名导入或命名空间导入**
  （构建期把 import 改写为 `globalThis.__beepShim*` 解构，保证与 Host 同一份实例，
  `CTX_KEY` 必须是同一个 Symbol）。不要改成 import map 方案——rolldown-vite 会把 shim
  入口摇树成空壳（踩过的坑，勿走回头路）。
- 本地联调要求三仓并列：`work-beep` / `work-beep-plugin-sdk` / `work-beep-plugin-blender`，
  经 `file:` 依赖互相引用；各包内 `packages: []` 的 pnpm-workspace.yaml 是为了挡住外层
  workspace 抢安装目标，不要删。

## 安全

- 契约部分（`dist/`）保持零运行时依赖；`vite` / `@vitejs/plugin-vue` 是打包命令的
  dependencies，只在插件构建期使用，不要让他们渗进 `src/index.ts`。
- `example/host-app/`、各 `node_modules/`、`dist/` 不进版本库。
