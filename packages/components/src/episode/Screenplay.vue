<script setup lang="ts">
import {
  Check,
  ChevronRight,
  Clapperboard,
  ClipboardCopy,
  Copy,
  GripVertical,
  ListTree,
  LoaderCircle,
  MessageSquareQuote,
  Mic,
  Plus,
  Repeat2,
  Sparkles,
  Table2,
  Trash2,
} from '@lucide/vue'
import { numeral } from '@opendesign/common'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  cn,
} from '@opendesign/shadcn'
import type { Editor } from '@tiptap/core'
import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
import FileHandler from '@tiptap/extension-file-handler'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import Typography from '@tiptap/extension-typography'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import { NodeSelection, Selection, TextSelection } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { useDebounceFn, useLocalStorage } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import Bubble from '../document/Bubble.vue'
import { attach, blocks, cells, inserts } from '../document/commands'
import { suggest } from '../document/suggest'
import type { Choice, Command } from '../document/types'
import Tip from '../layout/Tip.vue'
import { body, classify, speaker, syntax } from './syntax'

type Heading = { level: number; text: string; position: number }

const props = defineProps<{
  script: string
  parsing: boolean
  speakers: { name: string; color: string }[]
  outline: string
}>()

const emit = defineEmits<{
  save: [script: string]
  parse: []
}>()

const paper = [
  'screenplay prose prose-sm max-w-none min-h-full px-14 pt-4 pb-40 outline-none',
  'prose-p:my-1.5 prose-p:leading-7 prose-headings:font-semibold prose-h1:text-xl prose-h1:mb-4',
  'prose-h2:text-primary prose-h2:text-[15px] prose-h2:mt-7 prose-h2:mb-2 prose-h3:text-sm prose-h3:mt-5 prose-h3:mb-1.5',
  'prose-blockquote:not-italic prose-blockquote:font-normal prose-pre:text-meta prose-code:before:content-none prose-code:after:content-none',
  'prose-img:rounded-lg prose-img:my-3 prose-hr:my-6',
].join(' ')

const extras = [
  '[&_.line-dialogue]:pl-8 [&_.line-narration]:pl-8 [&_.line-narration]:text-muted-foreground [&_.line-narration]:italic',
  '[&_.speaker]:text-foreground [&_.speaker]:font-semibold [&_.speaker]:not-italic',
  '[&_.mention]:bg-primary/10 [&_.mention]:text-primary [&_.mention]:rounded [&_.mention]:px-1 [&_.mention]:not-italic',
  '[&_mark]:bg-container/30 [&_mark]:rounded-sm [&_mark]:px-0.5 [&_mark]:text-inherit',
  '[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-1 [&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li]:gap-2 [&_ul[data-type=taskList]_li>label]:mt-1.5 [&_ul[data-type=taskList]_li>div]:flex-1',
  '[&_.tableWrapper]:overflow-x-auto [&_table]:my-3 [&_td]:relative [&_th]:relative [&_.selectedCell]:bg-selection/10 [&_.column-resize-handle]:bg-primary [&_.column-resize-handle]:absolute [&_.column-resize-handle]:-right-px [&_.column-resize-handle]:top-0 [&_.column-resize-handle]:bottom-0 [&_.column-resize-handle]:w-0.5',
  '[&_img.ProseMirror-selectednode]:ring-selection [&_img.ProseMirror-selectednode]:ring-2',
  '[&_.ProseMirror-selectednode:not(img)]:bg-selection/10 [&_.ProseMirror-selectednode]:rounded-md',
  '[&_.is-empty]:before:text-muted-foreground [&_.is-empty]:before:pointer-events-none [&_.is-empty]:before:float-left [&_.is-empty]:before:h-0 [&_.is-empty]:before:content-[attr(data-placeholder)]',
].join(' ')

const handle =
  'text-muted-foreground hover:bg-accent hover:text-foreground mt-0.5 flex size-6 items-center justify-center rounded transition-colors duration-150'

const markdown = ref(props.script)
const caret = ref(0)
const headings = shallowRef<Heading[]>([])
const counts = ref({ scenes: 0, lines: 0, chars: 0 })
const target = ref<number | null>(null)
const kind = ref('')
const sidebar = useLocalStorage('script-outline', true)

const save = useDebounceFn((value: string) => {
  if (value !== props.script) emit('save', value)
}, 800)

function index(editor: Editor, before: number) {
  let total = 1
  editor.state.doc.descendants((node, pos) => {
    if (pos >= before) return false
    if (node.type.name === 'heading' && classify(node.textContent) === 'scene') total += 1
    return !node.isTextblock
  })
  return total
}

function rewrite(editor: Editor, compose: (value: string, order: number) => string) {
  const { $from } = editor.state.selection
  if (!$from.parent.isTextblock) return
  const from = $from.start()
  const to = $from.end()
  const next = compose(body($from.parent.textContent), index(editor, from))
  const chain = editor.chain().focus()
  if (next) chain.insertContentAt({ from, to }, next).run()
  else chain.deleteRange({ from, to }).run()
}

function current(editor: Editor) {
  const { selection } = editor.state
  return selection instanceof NodeSelection ? selection.node : selection.$from.parent
}

const lines = computed<Command[]>(() => [
  {
    id: 'scene',
    group: '剧本',
    label: '场次',
    hint: '二级标题，出现在大纲里',
    icon: Clapperboard,
    run: (editor) => {
      editor.chain().focus().setHeading({ level: 2 }).run()
      rewrite(editor, (value, order) => `场${numeral(order)} · ${value || '地点 / 时间'}`)
    },
    active: (editor) => {
      const node = current(editor)
      return node.type.name === 'heading' && classify(node.textContent) === 'scene'
    },
  },
  {
    id: 'narration',
    group: '剧本',
    label: '旁白',
    icon: Mic,
    run: (editor) => {
      editor.chain().focus().setParagraph().run()
      rewrite(editor, (value) => `旁白：${value}`)
    },
    active: (editor) => {
      const node = current(editor)
      return node.type.name === 'paragraph' && classify(node.textContent) === 'narration'
    },
  },
  ...props.speakers.map((item) => ({
    id: `say-${item.name}`,
    group: '剧本',
    label: `${item.name}的对白`,
    icon: MessageSquareQuote,
    run: (editor: Editor) => {
      editor.chain().focus().setParagraph().run()
      rewrite(editor, (value) => `${item.name}：${value}`)
    },
    active: (editor: Editor) => {
      const node = current(editor)
      return node.type.name === 'paragraph' && speaker(node.textContent) === item.name
    },
  })),
])

const kinds = computed(() => [...lines.value, ...blocks])
const commands = computed(() => [...kinds.value, ...inserts])

const slash = suggest<Command>({
  name: 'slash',
  char: '/',
  items: (query) => {
    const word = query.trim().toLowerCase()
    return commands.value.filter(
      (item) => !word || item.label.toLowerCase().includes(word) || item.id.includes(word),
    )
  },
  pick: (editor, range, item) => {
    editor.chain().focus().deleteRange(range).run()
    item.run(editor)
  },
})

const mention = suggest<Choice>({
  name: 'mention',
  char: '@',
  items: (query) =>
    props.speakers
      .filter((item) => item.name.includes(query.trim()))
      .map((item) => ({ id: item.name, label: item.name, hint: '角色', color: item.color })),
  pick: (editor, range, item) => {
    editor.chain().focus().insertContentAt(range, `@${item.label} `).run()
  },
})

function scan(editor: Editor) {
  const list: Heading[] = []
  let scenes = 0
  let spoken = 0
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      list.push({ level: node.attrs.level as number, text: node.textContent, position: pos })
      if (classify(node.textContent) === 'scene') scenes += 1
    } else if (node.type.name === 'paragraph' && classify(node.textContent) === 'dialogue') {
      spoken += 1
    }
    return !node.isTextblock
  })
  headings.value = list
  counts.value = {
    scenes,
    lines: spoken,
    chars: editor.storage.characterCount?.characters() ?? 0,
  }
}

const editor = useEditor({
  content: props.script,
  contentType: 'markdown',
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, autolink: true },
    }),
    Markdown,
    Placeholder.configure({
      placeholder: ({ node }) =>
        node.type.name === 'heading' ? '标题' : '输入 / 插入内容，@ 提及角色',
    }),
    CharacterCount,
    Highlight,
    Typography,
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit.configure({ table: { resizable: true } }),
    Image.configure({ allowBase64: true }),
    FileHandler.configure({
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      onPaste: (instance, files, html) => {
        if (!html) void attach(instance, files)
      },
      onDrop: (instance, files, at) => void attach(instance, files, at),
    }),
    slash,
    mention,
    syntax,
  ],
  editorProps: { attributes: { class: paper, spellcheck: 'false', 'aria-label': '剧本' } },
  onCreate: ({ editor: instance }) => scan(instance),
  onUpdate: ({ editor: instance }) => {
    const value = instance.getMarkdown()
    markdown.value = value
    scan(instance)
    void save(value)
  },
  onSelectionUpdate: ({ editor: instance }) => {
    caret.value = instance.state.selection.from
  },
})

watch(
  () => props.script,
  (value) => {
    const instance = editor.value
    if (!instance || instance.isFocused || value === instance.getMarkdown()) return
    instance.commands.setContent(value, { emitUpdate: false, contentType: 'markdown' })
    markdown.value = value
    scan(instance)
  },
)

const active = computed(() => headings.value.findLastIndex((item) => item.position < caret.value))

const chosen = computed(() => {
  const instance = editor.value
  return instance ? kinds.value.find((item) => item.active?.(instance))?.id : undefined
})

const turnable = computed(() => !['table', 'image', 'horizontalRule'].includes(kind.value))

function jump(item: Heading) {
  editor.value
    ?.chain()
    .focus()
    .setTextSelection(item.position + 1)
    .scrollIntoView()
    .run()
}

function hover({ pos }: { pos: number }) {
  if (pos >= 0) target.value = pos
}

function top(pos: number) {
  const instance = editor.value
  if (!instance) return null
  const doc = instance.state.doc
  const resolved = doc.resolve(Math.max(0, Math.min(pos, doc.content.size)))
  return resolved.depth ? resolved.before(1) : null
}

function block() {
  const instance = editor.value
  const from = target.value
  if (!instance || from === null) return null
  const node = instance.state.doc.nodeAt(from)
  return node ? { instance, from, node, to: from + node.nodeSize } : null
}

function aim(event: MouseEvent) {
  const instance = editor.value
  if (!instance) return
  const hit = instance.view.posAtCoords({ left: event.clientX, top: event.clientY })
  const from = hit ? top(hit.pos) : target.value
  if (from === null) return
  target.value = from
  const found = block()
  kind.value = found?.node.type.name ?? ''
  if (!found || kind.value !== 'table') {
    instance.commands.setNodeSelection(from)
    return
  }
  const { selection, doc, tr } = instance.state
  if (selection.from > found.from && selection.to < found.to) return
  const at = Math.min(Math.max(hit?.pos ?? found.from, found.from + 1), found.to - 1)
  instance.view.dispatch(tr.setSelection(TextSelection.near(doc.resolve(at))))
}

function open(event: MouseEvent) {
  const grip = event.currentTarget as HTMLElement
  const rect = grip.getBoundingClientRect()
  grip.dispatchEvent(
    new MouseEvent('contextmenu', { bubbles: true, clientX: rect.right, clientY: rect.bottom }),
  )
}

function add(event: MouseEvent) {
  const found = block()
  if (!found) return
  const { instance, node, from, to } = found
  if (node.type.name === 'paragraph' && !node.content.size) {
    instance
      .chain()
      .focus(from + 1)
      .insertContent('/')
      .run()
    return
  }
  const at = event.altKey ? from : to
  instance
    .chain()
    .insertContentAt(at, { type: 'paragraph', content: [{ type: 'text', text: '/' }] })
    .focus(at + 2)
    .run()
}

function lock(value: boolean) {
  editor.value?.commands.setMeta('lockDragHandle', value)
}

function refocus(event: Event) {
  event.preventDefault()
  const instance = editor.value
  if (!instance) return
  const { selection, tr } = instance.state
  if (!selection.empty) instance.view.dispatch(tr.setSelection(Selection.near(selection.$to, -1)))
  instance.commands.focus()
}

function turn(command: Command) {
  const found = block()
  if (!found) return
  const { instance, from, to } = found
  const { doc, tr } = instance.state
  instance.view.dispatch(
    tr.setSelection(TextSelection.between(doc.resolve(from + 1), doc.resolve(to - 1))),
  )
  command.run(instance)
}

function exec(command: Command) {
  if (editor.value) command.run(editor.value)
}

function allowed(command: Command) {
  const instance = editor.value
  return instance && command.can ? command.can(instance) : true
}

function duplicate() {
  const found = block()
  if (found) found.instance.chain().focus().insertContentAt(found.to, found.node.toJSON()).run()
}

function copy() {
  const found = block()
  if (found) void navigator.clipboard?.writeText(found.node.textContent)
}

function remove() {
  const found = block()
  if (!found) return
  if (found.instance.state.doc.childCount === 1) {
    found.instance.chain().focus().clearContent().run()
    return
  }
  found.instance.chain().focus().deleteRange({ from: found.from, to: found.to }).run()
}
</script>

<template>
  <div class="bg-card flex h-full min-h-0">
    <nav v-if="sidebar" class="border-border bg-muted/40 w-56 shrink-0 space-y-4 overflow-y-auto border-r p-3">
      <section>
        <p class="text-muted-foreground mb-1.5 px-2 text-micro font-medium tracking-[0.12em] uppercase">
          大纲 · {{ headings.length }}
        </p>
        <button
          v-for="(item, position) in headings"
          :key="item.position"
          type="button"
          :class="
            cn(
              'text-data flex w-full items-center rounded-md py-1.5 pr-2 text-left transition-colors duration-150',
              item.level === 1 ? 'pl-2 font-medium' : item.level === 2 ? 'pl-4' : 'pl-7 text-meta',
              position === active
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )
          "
          @click="jump(item)"
        >
          <span class="truncate">{{ item.text || '无标题' }}</span>
        </button>
        <p v-if="!headings.length" class="text-muted-foreground px-2 text-meta leading-relaxed">
          标题会出现在这里，用 / 插入「场次」或二级标题
        </p>
      </section>

      <Collapsible v-if="outline" class="border-border border-t pt-3">
        <CollapsibleTrigger
          class="group text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 px-2 text-micro font-medium tracking-[0.12em] uppercase"
        >
          剧集大纲
          <ChevronRight class="ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p class="text-muted-foreground px-2 pt-2 text-meta leading-relaxed whitespace-pre-line">{{ outline }}</p>
        </CollapsibleContent>
      </Collapsible>
    </nav>

    <div class="flex min-w-0 flex-1 flex-col">
      <div class="flex h-12 shrink-0 items-center gap-2 px-4">
        <Tip :label="sidebar ? '收起大纲' : '展开大纲'">
          <Button
            variant="ghost"
            size="icon-sm"
            :class="cn(sidebar ? 'text-foreground' : 'text-muted-foreground')"
            @click="sidebar = !sidebar"
          >
            <ListTree />
          </Button>
        </Tip>
        <p class="text-muted-foreground text-meta tabular-nums">
          {{ counts.scenes }} 场 · {{ counts.lines }} 句台词 · {{ counts.chars }} 字
        </p>
        <div class="ml-auto flex items-center gap-1.5">
          <slot name="actions" />
          <Button size="sm" :disabled="parsing || !markdown.trim()" @click="emit('parse')">
            <LoaderCircle v-if="parsing" class="animate-spin" />
            <Sparkles v-else />
            {{ parsing ? '拆解中…' : 'AI 拆解分镜' }}
          </Button>
        </div>
      </div>

      <ContextMenu @update:open="lock">
        <ContextMenuTrigger as-child>
          <div :class="cn('relative min-h-0 flex-1 overflow-y-auto', extras)" @contextmenu="aim">
            <EditorContent :editor="editor" class="mx-auto h-full max-w-3xl" />
            <DragHandle v-if="editor" :editor="editor" :on-node-change="hover">
              <div class="flex items-center gap-0.5 pr-1.5">
                <Tip label="添加块" side="bottom">
                  <template #content>
                    <span class="grid gap-0.5">
                      <span><b class="font-semibold">点击</b> <span class="opacity-70">在下方添加</span></span>
                      <span><b class="font-semibold">Alt + 点击</b> <span class="opacity-70">在上方添加</span></span>
                    </span>
                  </template>
                  <button type="button" :class="handle" @click="add">
                    <Plus class="size-4" />
                  </button>
                </Tip>
                <Tip label="拖动移动，点击打开菜单" side="bottom">
                  <template #content>
                    <span class="grid gap-0.5">
                      <span><b class="font-semibold">拖动</b> <span class="opacity-70">移动位置</span></span>
                      <span><b class="font-semibold">点击</b> <span class="opacity-70">打开菜单</span></span>
                    </span>
                  </template>
                  <button type="button" :class="cn(handle, 'cursor-grab active:cursor-grabbing')" @click="open">
                    <GripVertical class="size-4" />
                  </button>
                </Tip>
              </div>
            </DragHandle>
            <Bubble v-if="editor" :editor="editor" :kinds="kinds" />
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent class="w-52" @close-auto-focus="refocus">
          <ContextMenuLabel class="text-muted-foreground text-micro font-normal">块</ContextMenuLabel>
          <ContextMenuSub v-if="turnable">
            <ContextMenuSubTrigger>
              <Repeat2 />
              转为
            </ContextMenuSubTrigger>
            <ContextMenuSubContent class="max-h-80 w-48 overflow-y-auto">
              <ContextMenuItem v-for="item in kinds" :key="item.id" @select="turn(item)">
                <component :is="item.icon" />
                <span class="flex-1 truncate">{{ item.label }}</span>
                <Check v-if="item.id === chosen" class="text-primary" />
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub v-if="kind === 'table'">
            <ContextMenuSubTrigger>
              <Table2 />
              表格
            </ContextMenuSubTrigger>
            <ContextMenuSubContent class="w-44">
              <template v-for="(item, position) in cells" :key="item.id">
                <ContextMenuSeparator v-if="position && item.group !== cells[position - 1]?.group" />
                <ContextMenuItem
                  :variant="item.danger ? 'destructive' : 'default'"
                  :disabled="!allowed(item)"
                  @select="exec(item)"
                >
                  <component :is="item.icon" />
                  {{ item.label }}
                </ContextMenuItem>
              </template>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem @select="duplicate">
            <Copy />
            创建副本
          </ContextMenuItem>
          <ContextMenuItem @select="copy">
            <ClipboardCopy />
            复制文字
          </ContextMenuItem>
          <ContextMenuItem variant="destructive" @select="remove">
            <Trash2 />
            删除
            <ContextMenuShortcut>Del</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  </div>
</template>
