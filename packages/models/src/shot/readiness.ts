import type { Asset } from '../asset'
import { locked } from '../asset'
import { hasMotion } from './motion'
import type { Shot } from './schema'

export type Requirement = {
  id: string
  label: string
  ok: boolean
  hint: string
}

export function readiness(item: Shot, assets: Asset[]): Requirement[] {
  const bound = assets.filter((entry) => item.cast.includes(entry.id))
  const loose = bound.filter((entry) => entry.references.length > 0 && !locked(entry))
  const blank = bound.filter((entry) => entry.references.length === 0 && entry.kind !== 'character')
  const first = item.keyframes.find((entry) => entry.slot === 'first')

  return [
    {
      id: 'prompt',
      label: '画面描述',
      ok: item.prompt.trim().length >= 8,
      hint: '描述太短，生成结果不可控',
    },
    {
      id: 'cast',
      label: '绑定资产',
      ok: item.cast.length > 0,
      hint: '没有绑定角色或场景，跨镜一致性无从谈起',
    },
    {
      id: 'reference',
      label: '参考图锁定',
      ok: bound.length > 0 && loose.length === 0 && blank.length === 0,
      hint: [...loose, ...blank].length
        ? `${[...loose, ...blank].map((entry) => entry.name).join('、')} 的参考图还没锁定`
        : '先绑定资产',
    },
    {
      id: 'keyframe',
      label: '首帧就绪',
      ok: Boolean(first?.ready),
      hint: '首帧是视频生成的输入，必须先出图',
    },
    {
      id: 'move',
      label: '运镜设定',
      ok: item.move.kind === 'static' || hasMotion(item.move),
      hint: '起幅与落幅一样，等于没有运镜',
    },
  ]
}

export function ready(item: Shot, assets: Asset[]) {
  return readiness(item, assets).every((entry) => entry.ok)
}
