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
- 页面只通过 `@opendesign/queries` 读写。查询键集中在 `packages/queries/src/cache.ts` 的 `keys`，缓存失效统一用 `useInvalidate()`。
- 更新统一走 `patchXxx(id, patch)`，`XxxPatch` 由模型类型推导。修改类 mutation 由 `usePatch()` 生成：自带乐观更新，并在最后一个并发请求结束后才统一刷新，拖拽松手不会先渲染旧数据再跳变。TanStack Query 的通知改为 `queueMicrotask` 调度。
- 生成类操作（剧本拆解、参考图、关键帧、视频、配音、合成出片）统一提交任务：`useCreateTask().mutate({ kind, ... })`，请求结构见模型里的 `TaskRequest`。
- 写入模拟数据源前经 `plain()` 拍平响应式代理。接入后端时只替换 `packages/queries/src/mock`，音频接入真实 TTS 与音效素材时只替换 `packages/composables/src/audio`。

## 路由与状态

- `xxx.ts` 声明路由，`xxx.component.vue` 写视图，`routeTree.gen.ts` 由插件生成。
- 分集工作区的上下文（分集、作品）用 `useWorkspace()` 获取；对话框开关与最近打开的分集同在 `apps/web/src/workspace.ts`，剪辑视图也能直接打开资产库。

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
