import type { AssetKind, Role, View, Voice } from './schema'

export const assetKindLabel: Record<AssetKind, string> = {
  character: '角色',
  scene: '场景',
  prop: '道具',
  costume: '服装',
}

export const roleLabel: Record<Role, string> = {
  lead: '主角',
  support: '配角',
  extra: '龙套',
}

export const voiceLabel: Record<Voice, string> = {
  'warm-male': '温润男声',
  'bright-female': '清亮女声',
  'low-male': '低沉男声',
  'soft-female': '柔和女声',
  narrator: '旁白',
}

export const viewLabel: Record<View, string> = {
  front: '正面',
  side: '侧面',
  back: '背面',
  closeup: '特写',
}
