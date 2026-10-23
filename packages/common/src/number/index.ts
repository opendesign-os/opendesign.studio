export function tenth(value: number) {
  return Math.round(value * 10) / 10
}

const DIGITS = '零一二三四五六七八九'

export function numeral(value: number) {
  if (value < 0 || value >= 100 || !Number.isInteger(value)) return String(value)
  const tens = Math.floor(value / 10)
  const ones = value % 10
  if (!tens) return DIGITS[ones] ?? ''
  return `${tens > 1 ? DIGITS[tens] : ''}十${ones ? DIGITS[ones] : ''}`
}
