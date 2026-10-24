# 参与开发

## 工作流

1. 按 [README](README.md#开始) 安装依赖并启动开发服务器。
2. 提交前在本地跑一遍与 CI 相同的检查：

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   ```

3. 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)：`feat:`、`fix:`、`refactor:`、`docs:`、`chore:` 等。

基础格式（缩进、换行、编码）由 `.editorconfig` 统一，Biome 直接读取；仓库统一 LF 换行（`.gitattributes`）。

## 命名

- 优先单个通用英文单词，文件名同样（`Stage` `Gallery` `Timeline`）；单词无法准确表达或与模型同名时才组合（`ShotForm` `AssetCard`）。文件按功能分目录。
- 组合式函数用 `useXxx`，工厂函数用 `createXxx`；数据源接口统一为「动词 + 资源」：`list` `read` `create` `patch` `remove`。
- 组件事件语义统一：`select` 选中、`open` 进入、`change` 提交修改（参数为新值或 patch）、`update:xxx` 配合 `v-model:xxx`。同类事件合并为一个带参数的事件，不并列多个（如时间轴的 `retime`、`toggle`）。
- 不写注释，靠命名与结构表达意图。

## 数据

- 结构只在 zod 模型里定义一次，类型用 `z.infer` 推导；枚举取值直接用 `xxx.options`，不另建数组。
- 页面只通过 `@opendesign/queries` 读写，请求统一走 `common/api.ts`（ofetch）。查询键集中在 `packages/queries/src/common/cache.ts` 的 `keys`，缓存失效统一用 `useInvalidate()`。
- 登录状态只以 better-auth 的 `auth.useSession()` 为准：根路由据此在登录页与工作区之间跳转，接口返回 401 时通知 better-auth 刷新会话（`auth.$store.notify('$sessionSignal')`），不另做判断。
- 更新统一走 `patchXxx(id, patch)`，`XxxPatch` 由模型类型推导。修改类 mutation 由 `usePatch()` 生成：自带乐观更新，并在最后一个并发请求结束后才统一刷新，拖拽松手不会先渲染旧数据再跳变。TanStack Query 的通知改为 `queueMicrotask` 调度。
- 生成类操作（剧本拆解、参考图、关键帧、视频、合成出片、整集生成）统一提交任务：`useCreateTask().mutate({ kind, ... })`，请求结构见模型里的 `TaskRequest`。生成后的素材在模型里只存对象存储的 key，界面用 `media(key)` 得到地址（`/api/media/...` 鉴权后跳转到预签名链接）。任务进行中时任务列表自动轮询，任务结束后刷新受影响的数据。

## 路由与状态

- `xxx.ts` 声明路由，`xxx.component.vue` 写视图，`routeTree.gen.ts` 由插件生成。
- 分集工作区的上下文（分集、作品）用 `useWorkspace()` 获取；对话框开关与最近打开的分集同在 `apps/web/src/composables/workspace.ts`，剪辑视图也能直接打开资产库。

## 服务端

- 结构：`config/` 环境变量（zod 校验，`@nestjs/config` 加载），`common/` 数据库模块、查询辅助与通用装饰器，`modules/` 每个业务一个模块（module / controller / service）。
- 表结构只在 `packages/schemas` 定义，统一用 `createTable` 建表：自动带 `id`、`createdAt`、`createdBy`、`updatedAt`、`updatedBy`，后两者由请求上下文里的当前用户填写。迁移在 `apps/api/drizzle`，改表后运行 `db:generate` 生成。
- 请求参数用 `@opendesign/models` 里的同一份 zod 模型校验：`@Body({ schema })`、`@Query('x', { schema })`，路径 id 用 `@Id()`；业务数据一律按团队隔离，用 `@Tenant()` 取当前团队。
- 认证由 better-auth 挂在 `/api/auth/*`，其余接口默认需要登录；新用户注册时自动创建个人团队。
- 服务层方法统一为 `list` `find` `create` `update` `remove`，接口按资源平铺：`GET /api/assets?seriesId=`、`POST /api/assets`、`PATCH /api/assets/:id`、`DELETE /api/assets/:id`。
- 生成任务：写任务行与入队在同一事务里完成（pg-boss 的 `fromDrizzle`），按能力分队列（text / image / video / compose），团队并发上限用 pg-boss 的本地分组配额（`localGroupConcurrency`，在单个进程内精确计数；全局配额在多个执行者同时取任务时会超发），重试次数取模型配置。每一步是 `modules/tasks/jobs` 下的一个 `*.job.ts`，模型调用统一走 Vercel AI SDK。`episode.job.ts` 是编排作业：它不自己调模型，而是按资产→参考图→首尾帧→视频→合成的依赖分阶段创建子任务并轮询等待，已完成的步骤跳过，所以中断后重跑只补缺口；它有独立队列，不占用图像和视频的执行者。厂商（`vendors`，团队的接入账号）和能力配置（`providers`，每类任务用哪个厂商的哪个模型）分开存；接口类型到 AI SDK provider 的映射和模型列表拉取集中在 `modules/vendors/protocols.ts`；没有现成 provider 的接口（如 MiniMax 的图片与视频）按 AI SDK 的 `ImageModelV4` / `VideoModelV4` 实现成适配，放在同目录下（`minimax.ts`），任务代码不感知差异。厂商返回的视频链接用 `protocols.download` 直接下载，不走 AI SDK 默认下载的内网地址校验：开着 fake-IP 代理的开发机会把公网域名解析到 `198.18.0.0/15` 而被误拦；公开部署时在网络层限制服务端出口。新增预设厂商只在 `packages/models` 的 `vendor/presets.ts` 里加一项；新增接口类型时再改 `protocol` 枚举、`abilities` 和 `protocols.ts`。
- 素材读写走 `common/storage`（S3 兼容），key 按团队前缀存放，`GET /api/media/:owner/:file` 校验团队后跳转到预签名链接。

## 界面

- **按钮**：图标优先，悬停用 `Tip` 显示名称和快捷键；只有主操作（提交出片、AI 拆解分镜、新建资产）保留文字。数量提示用小圆点，不用彩色数字角标。
- **头像**：角色、作品的首字色块统一用 `Avatar`；状态色统一取 `tones`（镜头、分集、作品），色点类名取 `fills`。
- **滚动条**：全局用 Tailwind 4 原生的 `scrollbar-thin` / `scrollbar-thumb-*`，细滚动条默认透明、鼠标悬停才浮现，不另装插件。
- **分割条与自适应**：面板分割条带胶囊形拖拽手柄，悬停与拖动时高亮，触摸热区 12px；面板内容用容器查询（`@container`）按自身宽度调整，网格用 `repeat(auto-fill, minmax(min(最小宽, 100%), 1fr))` 自动排列，面板比最小宽还窄时卡片跟着收窄，选中描边不会被滚动条挡住；窄时标签收成图标、次要控件隐藏。
- **提示与弹层**：Reka 的 Tooltip 与 Popover / DropdownMenu 共用未隔离的定位上下文，提示包住弹层触发器时会抢走锚点。因此下拉菜单内容用 `reference` 显式定位到按钮，Popover 用 `PopoverAnchor`；被提示包裹的开关、页签、触发器按 `aria-pressed` / `aria-selected` / `aria-expanded` 着色，分割条按 `data-resize-handle-state` 高亮，不依赖会被提示覆盖的 `data-state`。
- **动效**：分区折叠按 Reka 提供的内容高度做高度过渡，页签切换淡入；左侧素材栏与右侧检查器是可折叠面板，点按钮折叠 / 展开时宽度平滑过渡，拖拽时不加过渡。
- **拖拽**：可拖拽的区域都 `select-none` 并在按下时阻止默认行为；单镜头查询用已缓存的整集列表预填并保留上一份数据，拖播放头跨镜头时页面不会清空重绘。

## 样式

- **shadcn**：组件源码可按设计系统定制——已统一为紧凑密度（`text-data` 12px 等），并给 Badge 换成语义色变体（neutral / accent / info / success / warn / danger）。新增组件用 shadcn-vue CLI 或从其 registry 拉取，未使用的组件不保留。
- **设计令牌**：集中在 `packages/shadcn/src/theme.css`，字号令牌 `text-micro/meta/data/body/title`；`cn()` 已为这些令牌扩展 tailwind-merge，否则会被误当成颜色类合并掉。只保留被引用的令牌。默认浅色，主题偏好由 VueUse 持久化。

## 工程

- **依赖**：多个包共用的依赖版本写在 `pnpm-workspace.yaml` 的 `catalog`，包内用 `catalog:` 引用；内部包用 `workspace:*`。
- **打包**：`components`、`shadcn` 声明 `sideEffects: ["**/*.css"]` 以便按路由摇树；带全局样式的重组件（`Canvas`、`Graph`）由页面按子路径单独引入。
- **TypeScript** 暂停在 6.x：vue-tsc 依赖 `typescript/lib/tsc`，TypeScript 7 不再提供该入口。
