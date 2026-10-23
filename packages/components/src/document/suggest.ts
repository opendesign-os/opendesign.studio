import type { VirtualElement } from '@floating-ui/dom'
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import type { Editor, Range } from '@tiptap/core'
import { Extension } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import type { SuggestionProps } from '@tiptap/suggestion'
import { Suggestion } from '@tiptap/suggestion'
import { VueRenderer } from '@tiptap/vue-3'
import Choices from './Choices.vue'
import type { Choice } from './types'

type Options<T extends Choice> = {
  name: string
  char: string
  items: (query: string) => T[]
  pick: (editor: Editor, range: Range, item: T) => void
}

function popup() {
  let renderer: VueRenderer | null = null
  let latest: SuggestionProps<Choice> | null = null
  let stop: (() => void) | undefined

  const reference: VirtualElement = {
    getBoundingClientRect: () => latest?.clientRect?.() ?? new DOMRect(),
  }

  function place() {
    const element = renderer?.element as HTMLElement | undefined
    if (!element) return
    void computePosition(reference, element, {
      placement: 'bottom-start',
      strategy: 'fixed',
      middleware: [offset(6), flip(), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      element.style.left = `${x}px`
      element.style.top = `${y}px`
    })
  }

  function close() {
    stop?.()
    ;(renderer?.element as HTMLElement | undefined)?.remove()
    renderer?.destroy()
    renderer = null
    latest = null
  }

  return {
    onStart(props: SuggestionProps<Choice>) {
      latest = props
      renderer = new VueRenderer(Choices, { props, editor: props.editor })
      const element = renderer.element as HTMLElement
      Object.assign(element.style, { position: 'fixed', left: '0', top: '0', zIndex: '60' })
      document.body.appendChild(element)
      reference.contextElement = props.editor.view.dom
      stop = autoUpdate(reference, element, place)
    },
    onUpdate(props: SuggestionProps<Choice>) {
      latest = props
      renderer?.updateProps(props)
      place()
    },
    onKeyDown({ event }: { event: KeyboardEvent }) {
      if (event.key === 'Escape') {
        close()
        return true
      }
      return (
        (renderer?.ref as { keydown?: (event: KeyboardEvent) => boolean } | undefined)?.keydown?.(
          event,
        ) ?? false
      )
    },
    onExit: close,
  }
}

export function suggest<T extends Choice>(options: Options<T>) {
  return Extension.create({
    name: options.name,
    addProseMirrorPlugins() {
      return [
        Suggestion<T>({
          pluginKey: new PluginKey(options.name),
          editor: this.editor,
          char: options.char,
          items: ({ query }) => options.items(query),
          command: ({ editor, range, props }) => options.pick(editor, range, props),
          render: popup,
        }),
      ]
    },
  })
}
