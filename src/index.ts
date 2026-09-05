// @beep/sdk —— 插件与 Host 之间的唯一契约。
// 故意做薄：这里只有类型 + definePlugin 恒等函数 + ctx 注入键，
// 全部能力（launch/embed/call……）由 Host 实现并通过 PluginContext 传导进插件。
// 插件构建时把 @beep/sdk 与 vue 标为 external（见本包 ./kit 构建预设），
// 运行时由 Host 的 import map 解析到 Host 自带的那一份。
import type { Component, InjectionKey } from "vue";

/** 面板区域的物理像素矩形（无边框窗口，webview 原点即窗口客户区原点） */
export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** launch 的返回值：子进程 pid；args 含 {port} 占位符时为挑选出的就绪端口 */
export interface ProcInfo {
    pid: number;
    port: number | null;
}

/**
 * Host 传导给插件的服务。插件不直接 import 任何 @tauri-apps/* ——
 * 能力只从 ctx 拿，这是"窗口和启动部分由 SDK 传导进入"的落点。
 */
export interface PluginContext {
    /** 拉起外部进程。args 支持占位符：{port} 挑空闲端口并等其 TCP 就绪（60s）；{base} = Host 基准目录 */
    launch(executable: string, args: string[]): Promise<ProcInfo>;
    /** 杀掉 launch 拉起的子进程 */
    kill(pid: number): Promise<void>;
    /** 把 pid 的主窗口嵌入 rect 区域（仅 Windows，SetParent + WebView 挖洞） */
    embed(pid: number, rect: Rect): Promise<void>;
    /** 同步已嵌入窗口的位置（未嵌入时静默跳过） */
    syncRect(pid: number, rect: Rect): Promise<void>;
    /** TCP JSON-lines 桥命令薄转发（插件自己的桥服务端口） */
    call(port: number, cmd: string, params: unknown): Promise<unknown>;
    /** 取插件 assets 内文件的绝对路径（桥脚本、辅助程序等） */
    resolveAsset(rel: string): string;
    /** 本地路径是否为已存在的文件（探测绿色版 exe 等） */
    exists(path: string): Promise<boolean>;
    /** HTTP 下载到 dest（仅允许插件目录内）。onProgress 的 total 可能为 0 */
    download(
        url: string,
        dest: string,
        onProgress?: (done: number, total: number) => void,
    ): Promise<void>;
    /** 解压 zip 到 destDir（仅允许插件目录内） */
    extractZip(zipPath: string, destDir: string): Promise<void>;
    /** 删除文件或目录（仅允许插件目录内，用于重装绿色版） */
    removePath(path: string): Promise<void>;
    /** 元素的物理像素矩形（embed/syncRect 的坐标来源） */
    rectOf(el: HTMLElement): Rect | null;
    /** 监听元素尺寸变化与应用窗口移动，回调最新矩形；返回取消函数 */
    watchRect(el: HTMLElement, cb: (rect: Rect) => void): () => void;
}

/** 插件声明的工具。name 必须带 "插件id." 命名空间前缀（Host 注册时强制校验） */
export interface PluginTool {
    name: string;
    /** 写短：tool schema 是 token 大头（设计理念：收窄模型的世界） */
    description: string;
    parameters: {
        type: "object";
        properties?: Record<string, { type?: string; description?: string; enum?: unknown[] }>;
        required?: string[];
        additionalProperties?: boolean;
    };
    /** 执行体；返回给模型的文本结果。抛错会被 Host 转成 tool 错误消息回灌 */
    run(args: Record<string, unknown>, ctx: PluginContext): Promise<string>;
}

/** 插件定义：definePlugin 的参数形状 */
export interface PluginDef {
    id: string;
    name: string;
    /** 右栏 View：插件自己的 Vue 组件，激活时挂载 */
    view: Component;
    /** 工具声明：激活时注入 Host 工具注册表，切换/卸载时移除 */
    tools?: PluginTool[];
    /** 激活钩子（注册工具之后调用）；启动外部进程也可由 View 内用户动作触发 */
    start?(ctx: PluginContext): void | Promise<void>;
    /** 停用钩子：清理进程与状态 */
    stop?(ctx: PluginContext): void | Promise<void>;
}

/** 恒等函数，只为类型检查与统一入口形状 */
export function definePlugin(def: PluginDef): PluginDef {
    return def;
}

/** View 组件内 `inject(CTX_KEY)` 拿 PluginContext */
export const CTX_KEY: InjectionKey<PluginContext> = Symbol("beep-plugin-ctx");
