import { Decoration, Extension } from '@tiptap/core'

export type Line = 'scene' | 'dialogue' | 'narration' | 'action' | 'blank'

const SPEAKER = /^([^\s:：]{1,10})[:：]/
const MENTION = /@[^\s@，。！？、：:,.!?；;]{1,12}/g

export function body(text: string) {
  return text
    .trim()
    .replace(/^场[^·\s]*\s*·\s*/, '')
    .replace(SPEAKER, '')
    .trim()
}

export function speaker(text: string) {
  return SPEAKER.exec(text.trim())?.[1] ?? ''
}

export function classify(text: string): Line {
  const value = text.trim()
  if (!value) return 'blank'
  if (value.startsWith('场')) return 'scene'
  if (/^旁白[:：]/.test(value)) return 'narration'
  return SPEAKER.test(value) ? 'dialogue' : 'action'
}

export const syntax = Extension.create({
  name: 'syntax',
  addDecorations() {
    return {
      create: ({ state }) => {
        const list: Decoration[] = []
        state.doc.descendants((node, pos) => {
          if (!node.isTextblock) return true
          const text = node.textContent
          if (node.type.name === 'paragraph') {
            const kind = classify(text)
            if (kind === 'dialogue' || kind === 'narration') {
              list.push(Decoration.Node(pos, pos + node.nodeSize, { class: `line-${kind}` }))
              const speaker = SPEAKER.exec(text)
              if (speaker) {
                list.push(
                  Decoration.Inline(pos + 1, pos + 1 + speaker[0].length, { class: 'speaker' }),
                )
              }
            }
          }
          for (const match of text.matchAll(MENTION)) {
            const from = pos + 1 + (match.index ?? 0)
            list.push(Decoration.Inline(from, from + match[0].length, { class: 'mention' }))
          }
          return false
        })
        return list
      },
    }
  },
})
