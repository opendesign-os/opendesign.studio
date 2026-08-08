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
  components/     项目自有组件：组合 shadcn 基件，数据与事件走 props / emit
  platform/       端能力契约（types.ts）+ web.ts / native.ts 两套实现
  shadcn/         shadcn-vue 源码基座与设计令牌 theme.css
```

新增端能力时的动作顺序：先在 `packages/platform/src/types.ts` 加字段，再补齐 `web.ts` 与 `native.ts`，核心应用通过 `getPlatform()` 使用，不直接引用任何端的 API。

端差异只有两处出口：`platform.kind`（browser / desktop / mobile，用于布局分支，例如移动端走底部导航、其余走侧栏）与 platform 实现内部。业务代码里不应出现 `window.__TAURI__` 或 `navigator.userAgent` 判断。

## 界面

页面按设计稿实现，路由与页面的对应关系：

| 路由 | 页面 |
| --- | --- |
| `/` | Chats 首页：问候语、输入框、Quick start 卡片 |
| `/chats/$id` | 会话详情：消息流、反馈操作、底部输入框 |
| `/code` | 项目列表：状态徽章、语言标签、代码量进度条 |
| `/code/$name` | 代码浏览：文件树 + 语法高亮，左右可拖拽分栏 |
| `/tasks` | 任务看板：统计卡、搜索与筛选、看板/列表双视图、创建任务弹窗 |
| `/colab` `/projects` `/agents` `/companies` | 占位页 |

`packages/components` 里的组件都不含路由与业务数据，靠 props / emit 接线：

| 组件 | 用途 |
| --- | --- |
| `NavSidebar` `NavTabbar` `NavItem` | 侧栏（浏览器 / 桌面）与底部导航（移动端） |
| `WorkspaceTabs` | 顶部 Chats / Colab / Code 分段控件 |
| `ChatComposer` | 输入框，含工具按钮与模型选择 |
| `MessageBlocks` | 消息富文本（标题 / 段落 / 分隔线） |
| `QuickStartCard` `ProjectCard` | 首页快捷卡片、项目卡片 |
| `FileTree` `CodeView` | 文件树与 shiki 语法高亮（亮/暗双主题） |
| `StatCard` `BoardColumn` `TaskCard` `TaskDialog` | 任务看板的统计卡、看板列、任务卡与创建弹窗 |

主题切换写在 `packages/app/src/theme.ts`，深浅偏好经 `platform.store` 持久化——浏览器落到 localStorage，桌面与移动端落到 Tauri store 插件，同一份代码不分叉。首次进入跟随系统偏好。

界面文案与示例数据放在 `packages/app/src/data`，接真实接口时替换这一层即可，页面组件不用动。

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
- **组件分两层**：`packages/shadcn` 只放 shadcn-vue CLI 生成的源码，在该包目录下用 `pnpm dlx shadcn-vue@latest add <组件>` 追加，不手改、Biome 也不检查；项目自有组件写在 `packages/components`，可以组合 shadcn 基件，但不引用路由与业务数据——导航类组件通过 `items` / `active` 接收数据，用 `select` 事件把动作交回 app。
- **样式**：设计令牌集中在 `packages/shadcn/src/theme.css`（含亮/暗两套与品牌色 `--brand`、状态色 `--success`），全局样式、字体与移动端安全区适配在 `packages/app/src/style.css`；新增包后要在该文件补 `@source`，否则 Tailwind 扫不到类名。
- **字体**：Space Grotesk（正文）与 JetBrains Mono（代码）由 `@fontsource-variable/*` 本地打包，离线可用，不依赖 Google Fonts。
- **Tauri 权限**：新增插件后要在 `apps/native/src-tauri/capabilities/default.json` 登记权限，否则前端调用会被拒绝。
- **依赖版本**：只有基础工具链（typescript / biome / turbo / @types/node）走 `pnpm-workspace.yaml` 的 catalog 统一版本，其余依赖各包自行声明。
- **代码风格**：Biome 统一格式化与 lint——单引号、按需分号、行宽 100、2 空格缩进。
