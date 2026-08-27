#!/usr/bin/env node
// beep-plugin —— 插件打包命令（定位类似 tauri CLI：插件 pnpm 装好 @beep/sdk 后即用）。
// 用法（在插件根目录执行，一般写进 package.json scripts）：
//   beep-plugin build   # 打包插件 → dist/（plugin.js + plugin.json + assets/）
//   beep-plugin dev     # 监听源码变化持续打包
import { build } from "vite";
import { definePluginBuild } from "./kit.mjs";

const [cmd] = process.argv.slice(2);

if (cmd === "build" || cmd === "dev") {
    const config = definePluginBuild();
    if (cmd === "dev") config.build.watch = {};
    try {
        await build(config);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
} else {
    console.error(
        "用法：beep-plugin <命令>\n" +
            "  build   打包插件到 dist/\n" +
            "  dev     监听源码变化持续打包",
    );
    process.exit(cmd ? 1 : 0);
}
