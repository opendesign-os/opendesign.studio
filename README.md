# opendesign.studio

「开镜」——短剧与漫剧的 AI 生产台。短剧与漫剧共用同一套模型，区别只在镜头里填什么：写实只走配音字幕，漫剧再叠气泡、特效字与 2.5D 运镜。

服务端负责账号、团队、业务数据与整条生成链路：剧本拆解 → 参考图与关键帧 → 图生视频 → 配音 → ffmpeg 合成出片。各环节用哪家模型在设置页按团队配置，生成任务进入队列异步执行，产出的素材存进 S3 兼容存储并直接在界面里显示。

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
| 服务端      | NestJS 12（Express），Standard Schema 校验     |
| 数据库      | PostgreSQL、Drizzle ORM（`@nestjs/drizzle`）   |
| 账号 / 团队 | better-auth（organization 插件）               |
| 配置        | `@nestjs/config` + zod                         |
| 请求 / 时间 | ofetch、date-fns                               |
| 模型调用    | Vercel AI SDK（各家官方 provider）             |
| 任务队列    | pg-boss（复用 PostgreSQL）                     |
| 素材存储    | S3 兼容存储（AWS SDK，本地用 MinIO）           |
| 合成出片    | ffmpeg（ffmpeg-static）                        |

## 目录

```
apps/
  api/           服务端（NestJS）：config/ 环境变量，common/ 数据库与通用装饰器，modules/ 按业务分模块；drizzle/ 为迁移
  web/           网页端：routes/ 路由视图，components/ 与 composables/ 为本应用专用的组件与组合式函数
  native/        Tauri 2 壳
packages/
  common/        纯函数工具：number/ 取整与中文数字，time/ 时间格式
  models/        zod 模型、类型、标签与领域函数，按业务分目录（asset/ series/ shot/ …）
  schemas/       Drizzle 表结构，按业务分目录；common/ 提供统一建表的 createTable
  queries/       TanStack Query 组合式函数，按业务分目录；common/ 为请求客户端与缓存
  composables/   公用组合式函数：audio/ 音频，history/ 撤销栈，theme/ 主题
  components/    公用业务组件，按业务分目录
  shadcn/        shadcn-vue 组件源码与设计令牌 theme.css
docs/            设计与交互说明
```

依赖单向：`common → models → schemas / queries / composables → components → apps/web`；`schemas` 只被 `apps/api` 引用，`shadcn` 只被 `components` 与 `apps/web` 引用。

## 开始

环境：Node ≥ 22、pnpm 12、Docker；原生端另需 Rust ≥ 1.90，移动端按 Tauri 文档配置 Android SDK/NDK 或 Xcode。

```bash
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
pnpm --filter @opendesign/api db:migrate
pnpm dev
```

`docker compose` 会启动 PostgreSQL 和 MinIO（S3 兼容存储，控制台 http://localhost:9001）。`apps/api/.env` 里的 `BETTER_AUTH_SECRET` 需要填一个至少 32 位的随机串（如 `openssl rand -base64 32`），`S3_*` 默认指向本地 MinIO，换成云存储时改这几项即可。端口被占用时：数据库和存储端口在根目录 `.env` 里用 `POSTGRES_PORT`、`STORAGE_PORT`、`STORAGE_CONSOLE_PORT` 改，服务端端口改 `apps/api/.env` 的 `PORT`，并同步 `apps/web/.env` 的 `API_URL`（见 `.env.example`）。

网页端运行在 http://localhost:5200，`/api` 由开发服务器代理到服务端（默认 http://localhost:3000）。首次使用在登录页注册，会自动创建个人团队；想直接看示例数据可运行 `pnpm --filter @opendesign/api db:seed`，演示账号见 `apps/api/src/common/database/seed.ts`。

### 模型接入

在「设置 → 模型」里为每类能力选择厂商、填写服务地址与密钥（密钥加密保存，界面只显示末四位），模型可从建议列表选，也可以直接填模型 ID 或火山方舟的接入点 ID：

| 能力           | 可选厂商                                                               |
| -------------- | ---------------------------------------------------------------------- |
| 剧本拆解       | Anthropic Claude、OpenAI、阿里云百炼（通义千问）、任意 OpenAI 兼容接口 |
| 参考图与关键帧 | 火山方舟 Seedream、OpenAI                                              |
| 图生视频       | 可灵、火山方舟 Seedance、阿里云百炼（万相）                            |
| 配音           | OpenAI 及兼容 `/audio/speech` 的语音服务（音色可按角色音色映射）       |

每类能力的并发上限按团队生效，失败按设置的次数重试，默认模型失败时改用备用模型。

| 命令                       | 说明                                      |
| -------------------------- | ----------------------------------------- |
| `pnpm dev`                 | 同时启动网页端与服务端开发服务器          |
| `pnpm build`               | 构建网页端与服务端                        |
| `pnpm typecheck`           | 全仓类型检查                              |
| `pnpm lint`                | Biome 检查（`pnpm lint:fix` 自动修复）    |
| `pnpm tauri dev`           | 桌面端调试（自动拉起网页端开发服务器）    |
| `pnpm tauri build`         | 打包桌面安装包                            |
| `pnpm tauri android init`  | 首次初始化 Android 工程（iOS 同理 `ios`） |
| `pnpm tauri android dev`   | Android 调试（iOS 同理 `ios dev`）        |
| `pnpm tauri icon icon.svg` | 由 `apps/native/icon.svg` 生成全套图标    |

数据库命令在服务端包内执行（`pnpm --filter @opendesign/api <命令>`）：`db:generate` 按表结构生成迁移，`db:migrate` 执行迁移，`db:seed` 导入示例数据。

`pnpm tauri` 会把参数原样交给 Tauri CLI。

## 参与开发

开发约定、命名规范与提交前检查见 [CONTRIBUTING.md](CONTRIBUTING.md)。
