import {
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Bold,
  Code,
  Columns3,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  PanelTop,
  Pilcrow,
  RemoveFormatting,
  Rows3,
  SquareCode,
  Strikethrough,
  Table,
  TableCellsMerge,
  TableCellsSplit,
  TextQuote,
  Underline,
} from '@lucide/vue'
import type { Editor } from '@tiptap/core'
import type { Command } from './types'

function read(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

export async function attach(editor: Editor, files: File[], at?: number) {
  const sources = await Promise.all(files.map(read))
  const images = files
    .map((file, position) => ({ type: 'image', attrs: { src: sources[position], alt: file.name } }))
    .filter((image) => image.attrs.src)
  if (!images.length) return
  const chain = editor.chain().focus()
  if (at === undefined) chain.insertContent(images).run()
  else chain.insertContentAt(at, images).run()
}

function pick(editor: Editor) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = () => void attach(editor, Array.from(input.files ?? []))
  input.click()
}

function wrapped(editor: Editor) {
  return ['bulletList', 'orderedList', 'taskList', 'blockquote'].some((name) =>
    editor.isActive(name),
  )
}

export const marks: Command[] = [
  {
    id: 'bold',
    label: '加粗',
    shortcut: 'Ctrl B',
    icon: Bold,
    run: (editor) => editor.chain().focus().toggleBold().run(),
    active: (editor) => editor.isActive('bold'),
  },
  {
    id: 'italic',
    label: '斜体',
    shortcut: 'Ctrl I',
    icon: Italic,
    run: (editor) => editor.chain().focus().toggleItalic().run(),
    active: (editor) => editor.isActive('italic'),
  },
  {
    id: 'underline',
    label: '下划线',
    shortcut: 'Ctrl U',
    icon: Underline,
    run: (editor) => editor.chain().focus().toggleUnderline().run(),
    active: (editor) => editor.isActive('underline'),
  },
  {
    id: 'strike',
    label: '删除线',
    shortcut: 'Ctrl Shift S',
    icon: Strikethrough,
    run: (editor) => editor.chain().focus().toggleStrike().run(),
    active: (editor) => editor.isActive('strike'),
  },
  {
    id: 'code',
    label: '行内代码',
    shortcut: 'Ctrl E',
    icon: Code,
    run: (editor) => editor.chain().focus().toggleCode().run(),
    active: (editor) => editor.isActive('code'),
  },
  {
    id: 'highlight',
    label: '高亮',
    shortcut: 'Ctrl Shift H',
    icon: Highlighter,
    run: (editor) => editor.chain().focus().toggleHighlight().run(),
    active: (editor) => editor.isActive('highlight'),
  },
]

export const clear: Command = {
  id: 'clear',
  label: '清除格式',
  icon: RemoveFormatting,
  run: (editor) => editor.chain().focus().unsetAllMarks().run(),
}

export const blocks: Command[] = [
  {
    id: 'paragraph',
    group: '基础',
    label: '正文',
    icon: Pilcrow,
    run: (editor) => editor.chain().focus().setParagraph().run(),
    active: (editor) => editor.isActive('paragraph') && !wrapped(editor),
  },
  {
    id: 'h1',
    group: '基础',
    label: '标题 1',
    icon: Heading1,
    run: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
    active: (editor) => editor.isActive('heading', { level: 1 }),
  },
  {
    id: 'h2',
    group: '基础',
    label: '标题 2',
    icon: Heading2,
    run: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
    active: (editor) => editor.isActive('heading', { level: 2 }),
  },
  {
    id: 'h3',
    group: '基础',
    label: '标题 3',
    icon: Heading3,
    run: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
    active: (editor) => editor.isActive('heading', { level: 3 }),
  },
  {
    id: 'bullet',
    group: '基础',
    label: '无序列表',
    icon: List,
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
    active: (editor) => editor.isActive('bulletList'),
  },
  {
    id: 'ordered',
    group: '基础',
    label: '有序列表',
    icon: ListOrdered,
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    active: (editor) => editor.isActive('orderedList'),
  },
  {
    id: 'task',
    group: '基础',
    label: '待办清单',
    icon: ListTodo,
    run: (editor) => editor.chain().focus().toggleTaskList().run(),
    active: (editor) => editor.isActive('taskList'),
  },
  {
    id: 'quote',
    group: '基础',
    label: '引用',
    icon: TextQuote,
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    active: (editor) => editor.isActive('blockquote'),
  },
  {
    id: 'code',
    group: '基础',
    label: '代码块',
    icon: SquareCode,
    run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    active: (editor) => editor.isActive('codeBlock'),
  },
]

export const inserts: Command[] = [
  {
    id: 'table',
    group: '插入',
    label: '表格',
    hint: '3 × 3，带表头',
    icon: Table,
    run: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: 'image',
    group: '插入',
    label: '图片',
    hint: '本地选择，也可直接粘贴或拖入',
    icon: ImagePlus,
    run: pick,
  },
  {
    id: 'divider',
    group: '插入',
    label: '分割线',
    icon: Minus,
    run: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
]

export const cells: Command[] = [
  {
    id: 'row-before',
    group: 'line',
    label: '上方插入行',
    icon: BetweenHorizontalStart,
    run: (editor) => editor.chain().focus().addRowBefore().run(),
  },
  {
    id: 'row-after',
    group: 'line',
    label: '下方插入行',
    icon: BetweenHorizontalEnd,
    run: (editor) => editor.chain().focus().addRowAfter().run(),
  },
  {
    id: 'column-before',
    group: 'line',
    label: '左侧插入列',
    icon: BetweenVerticalStart,
    run: (editor) => editor.chain().focus().addColumnBefore().run(),
  },
  {
    id: 'column-after',
    group: 'line',
    label: '右侧插入列',
    icon: BetweenVerticalEnd,
    run: (editor) => editor.chain().focus().addColumnAfter().run(),
  },
  {
    id: 'merge',
    group: 'cell',
    label: '合并单元格',
    icon: TableCellsMerge,
    run: (editor) => editor.chain().focus().mergeCells().run(),
    can: (editor) => editor.can().mergeCells(),
  },
  {
    id: 'split',
    group: 'cell',
    label: '拆分单元格',
    icon: TableCellsSplit,
    run: (editor) => editor.chain().focus().splitCell().run(),
    can: (editor) => editor.can().splitCell(),
  },
  {
    id: 'header',
    group: 'cell',
    label: '切换表头行',
    icon: PanelTop,
    run: (editor) => editor.chain().focus().toggleHeaderRow().run(),
  },
  {
    id: 'row-delete',
    group: 'delete',
    label: '删除行',
    danger: true,
    icon: Rows3,
    run: (editor) => editor.chain().focus().deleteRow().run(),
  },
  {
    id: 'column-delete',
    group: 'delete',
    label: '删除列',
    danger: true,
    icon: Columns3,
    run: (editor) => editor.chain().focus().deleteColumn().run(),
  },
]
