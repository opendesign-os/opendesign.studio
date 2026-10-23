# opendesign.studio

「开镜」——短剧与漫剧的 AI 生产台。短剧与漫剧共用同一套模型，区别只在镜头里填什么：写实只走配音字幕，漫剧再叠气泡、特效字与 2.5D 运镜。

画面生成、配音与渲染后端尚未接入，目前由内存模拟数据源承载完整流程。

## 功能

- **剧本**：Notion 式文档编辑，Markdown 存储，AI 拆解分镜与候选资产
- **人物**：角色关系图谱，作品内所有分集共用
- **分镜 / 画布**：按场次分组的镜头卡片与表格，Vue Flow 节点排布
- **剪辑**：素材栏、舞台预览、检查器与整集时间轴，台词朗读与音效实时合成
- **生产**：资产库与参考图锁定、任务队列、按能力配置的模型接入

各视图的交互细节见 [docs/interface.md](docs/interface.md)。

## 技术栈

全部使用成熟开源库，不自研同类能力：

| 能力        | 库                                             |
| ----------- | ---------------------------------------------- |
| 路由        | TanStack Router（文件路由 + 自动代码分割）     |
| 服务端状态  | TanStack Query（编辑走乐观更新）               |
| 表单 / 表格 | TanStack Form + zod，TanStack Table            |
| 基础组件    | shadcn-vue（Reka UI）                          |
| 文档编辑    | Tiptap 3（官方扩展）                           |
| 节点画布    | Vue Flow                                       |
| 组合式工具  | VueUse                                         |
| 音频        | 浏览器原生 Web Speech API 与 Web Audio API     |
| 样式 / 工程 | Tailwind CSS 4、Biome、Turborepo、pnpm         |
| 原生壳      | Tauri 2（桌面 / Android / iOS 直接加载网页端） |

## 目录

```
apps/
  web/           网页端：路由视图（routes/）、浮层面板（panels/）、工作区上下文（workspace.ts）
  native/        Tauri 2 壳
packages/
  common/        纯函数工具：时间格式、取整、中文数字
  models/        zod 模型、类型、标签与领域函数（shot/ 按功能拆分）
  queries/       TanStack Query 组合式函数；mock/ 为按资源拆分的内存数据源
  composables/   组合式函数：主题、撤销栈、音频（台词朗读、音效合成、混音调度）
  components/    业务组件，按功能分目录
  shadcn/        shadcn-vue 组件源码与设计令牌 theme.css
docs/            设计与交互说明
```

依赖单向：`common → models → queries / composables → components → apps/web`，`shadcn` 只被 `components` 与 `apps/web` 引用。

## 开始

环境：Node ≥ 22、pnpm 12；原生端另需 Rust ≥ 1.90，移动端按 Tauri 文档配置 Android SDK/NDK 或 Xcode。

```bash
pnpm install
pnpm dev
```

网页端运行在 http://localhost:5200。

| 命令                       | 说明                                      |
| -------------------------- | ----------------------------------------- |
| `pnpm dev`                 | 启动网页端开发服务器                      |
| `pnpm build`               | 构建网页端                                |
| `pnpm typecheck`           | 全仓类型检查                              |
| `pnpm lint`                | Biome 检查（`pnpm lint:fix` 自动修复）    |
| `pnpm tauri dev`           | 桌面端调试（自动拉起网页端开发服务器）    |
| `pnpm tauri build`         | 打包桌面安装包                            |
| `pnpm tauri android init`  | 首次初始化 Android 工程（iOS 同理 `ios`） |
| `pnpm tauri android dev`   | Android 调试（iOS 同理 `ios dev`）        |
| `pnpm tauri icon icon.svg` | 由 `apps/native/icon.svg` 生成全套图标    |

`pnpm tauri` 会把参数原样交给 Tauri CLI。

## 参与开发

开发约定、命名规范与提交前检查见 [CONTRIBUTING.md](CONTRIBUTING.md)。
