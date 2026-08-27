// @beep/sdk 的插件构建预设（原 @beep/plugin-kit，已并入本包，经 "./kit" 子路径导出）。
// 产物约定（Host 运行时加载器按此消费）：
//   dist/plugin.js   单文件 ESM，default 导出 definePlugin(...) 的返回值
//   dist/plugin.json 清单（从插件根目录复制）
//   dist/assets/**   资源原样复制（Python 桥等）
//
// 共享依赖的处理：插件里的 import { ... } from "vue" / "@beep/sdk" 被改写为
// 从 Host 全局命名空间解构（globalThis.__beepShimVue / __beepShimSdk），
// 保证插件与 Host 共用同一份 vue/sdk 实例（CTX_KEY 必须是同一个 Symbol）。
// 约束：插件源码只用具名导入或命名空间导入，不用 default 导入。
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import fs from "node:fs";
import path from "node:path";

const GLOBALS = {
    vue: "__beepShimVue",
    "@beep/sdk": "__beepShimSdk",
};

// import 语句 → 全局命名空间解构：
//   import { a, b as c } from "vue"   =>  const { a, b: c } = globalThis.__beepShimVue;
//   import * as v from "vue"          =>  const v = globalThis.__beepShimVue;
//   import "vue"                      =>  （删除，Host 已加载）
function globalizeExternals() {
    return {
        name: "beep-global-externals",
        renderChunk(code) {
            let out = code;
            for (const [pkg, globalName] of Object.entries(GLOBALS)) {
                const target = `globalThis.${globalName}`;
                const esc = pkg.replace(/[/@]/g, "\\$&");
                // 具名导入
                out = out.replace(
                    new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*["']${esc}["'];?`, "g"),
                    (_, names) =>
                        `const {${names.replace(/(\w+)\s+as\s+(\w+)/g, "$1: $2")}} = ${target};`,
                );
                // 命名空间导入
                out = out.replace(
                    new RegExp(`import\\s*\\*\\s*as\\s*(\\w+)\\s*from\\s*["']${esc}["'];?`, "g"),
                    `const $1 = ${target};`,
                );
                // 副作用导入
                out = out.replace(new RegExp(`import\\s*["']${esc}["'];?`, "g"), "");
            }
            return out;
        },
    };
}

function copyAssets(outDir) {
    return {
        name: "beep-copy-assets",
        closeBundle() {
            for (const item of ["plugin.json", "assets"]) {
                const src = path.resolve(process.cwd(), item);
                if (!fs.existsSync(src)) continue;
                fs.cpSync(src, path.join(outDir, item), { recursive: true });
            }
        },
    };
}

/** @param {{ entry?: string; outDir?: string }} [opts] */
export function definePluginBuild(opts = {}) {
    const outDir = opts.outDir ?? "dist";
    return defineConfig({
        plugins: [vue(), globalizeExternals(), copyAssets(outDir)],
        build: {
            lib: {
                entry: opts.entry ?? "src/plugin.ts",
                formats: ["es"],
                fileName: () => "plugin.js",
            },
            rollupOptions: {
                external: Object.keys(GLOBALS),
            },
            outDir,
            emptyOutDir: true,
        },
    });
}
