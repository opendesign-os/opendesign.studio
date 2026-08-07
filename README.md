# opendesign.studio

一套核心逻辑，跨浏览器、桌面端（Windows / macOS / Linux）与移动端（Android / iOS）。
Turborepo + pnpm workspace 管理，前端 Vue 3，原生外壳 Tauri 2。

## 架构

采用端口-适配器分层：核心应用只依赖 `@opendesign/platform` 暴露的能力契约，各端入口在挂载前注入自己的实现，端壳保持极薄。

```
apps/
  web/            浏览器薄壳：createWebPlatform() → mountApp()
  native/         Tauri 薄壳：createNativePlatform() → mountApp()
    src-tauri/    Rust 工程，桌面与移动共用（lib.rs + mobile_entry_point）
packages/
  app/            核心应用：路由、布局、页面，跨端共用；vite.ts 导出共享构建预设
  platform/       端能力契约（types.ts）+ web.ts / native.ts 两套实现
  ui/             组件库：shadcn-vue 源码与设计令牌 theme.css
```

新增端能力时的动作顺序：先在 `packages/platform/src/types.ts` 加字段，再补齐 `web.ts` 与 `native.ts`，核心应用通过 `getPlatform()` 使用，不直接引用任何端的 API。

端差异只有两处出口：`platform.kind`（browser / desktop / mobile，用于布局分支，例如移动端走底部导航、其余走侧栏）与 platform 实现内部。业务代码里不应出现 `window.__TAURI__` 或 `navigator.userAgent` 判断。

## 环境要求

- Node >= 22，pnpm 11（版本已由 `packageManager` 锁定）
- Rust >= 1.85（桌面端与移动端构建）
- Android：Android SDK + NDK，设置 `ANDROID_HOME` 与 `NDK_HOME`，并 `rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android`
- iOS：macOS + Xcode，并 `rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios`

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 浏览器端 http://localhost:5200
pnpm desktop          # 桌面端（自动拉起 native 壳的 vite，端口 5210）
pnpm android          # Android 真机 / 模拟器调试
pnpm ios              # iOS 真机 / 模拟器调试
pnpm build            # 构建两个壳的前端产物
pnpm desktop:build    # 打包桌面安装包
pnpm android:build    # 打包 APK / AAB
pnpm typecheck        # 全仓类型检查
pnpm lint             # Biome 检查
pnpm lint:fix         # Biome 检查并修复
```

移动端首次使用需要先生成平台工程：

```bash
pnpm --filter @opendesign/native android:init
```

图标改动后重新生成全套尺寸（桌面 ico/icns、Android mipmap、iOS AppIcon）：

```bash
pnpm --filter @opendesign/native icon
```

## 约定

- **代码自解释，不写注释**：靠语义化命名表达意图，工厂函数用 `createXXX`，取不到再建用 `getOrCreateXXX`。需要解释的内容写进本文件。
- **路由**：TanStack Router 文件路由，`packages/app/src/routes` 下每条路由拆两个文件——`xxx.ts` 声明路由（loader / beforeLoad / 校验），`xxx.component.vue` 只写视图。`routeTree.gen.ts` 由插件生成，不要手改。
- **构建配置**：路由生成与样式扫描口径由 `packages/app/vite.ts` 的 `createAppPlugins()` 统一提供，端壳的 vite 配置只写自己的端口、代理与产物差异。
- **组件库**：`packages/ui/src/ui` 是 shadcn-vue 生成的源码，用 `pnpm dlx shadcn-vue@latest add <组件>` 追加，Biome 不检查该目录。业务侧统一从 `@opendesign/ui` 导入。
- **样式**：设计令牌集中在 `packages/ui/src/theme.css`，全局样式与移动端安全区适配在 `packages/app/src/style.css`。
- **Tauri 权限**：新增插件后要在 `apps/native/src-tauri/capabilities/default.json` 登记权限，否则前端调用会被拒绝。
- **依赖版本**：只有基础工具链（typescript / biome / turbo / @types/node）走 `pnpm-workspace.yaml` 的 catalog 统一版本，其余依赖各包自行声明。
- **代码风格**：Biome 统一格式化与 lint——单引号、按需分号、行宽 100、2 空格缩进。
