/**
 * src를 dst 위에 덮어 그립니다. (source-over, 곧은 알파)
 * opacity는 레이어 불투명도(0~1)이고, dst를 직접 바꿉니다.
 */
export function blendOver(
  dst: Uint8ClampedArray,
  src: Uint8ClampedArray,
  opacity = 1,
): void {
  if (opacity <= 0) return
  for (let i = 0; i < src.length; i += 4) {
    const srcAlpha = src[i + 3]
    if (srcAlpha === 0) continue
    const sa = (srcAlpha / 255) * opacity
    const da = dst[i + 3] / 255
    if (sa >= 1 || da === 0) {
      dst[i] = src[i]
      dst[i + 1] = src[i + 1]
      dst[i + 2] = src[i + 2]
      dst[i + 3] = sa >= 1 ? 255 : sa * 255
      continue
    }
    const keep = da * (1 - sa)
    const outA = sa + keep
    dst[i] = (src[i] * sa + dst[i] * keep) / outA
    dst[i + 1] = (src[i + 1] * sa + dst[i + 1] * keep) / outA
    dst[i + 2] = (src[i + 2] * sa + dst[i + 2] * keep) / outA
    dst[i + 3] = outA * 255
  }
}

/** 알파는 그대로 두고 색만 rgb로 바꾼 새 버퍼 (어니언 스킨용) */
export function tint(
  src: Uint8ClampedArray,
  rgb: readonly [number, number, number],
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(src.length)
  for (let i = 0; i < src.length; i += 4) {
    if (src[i + 3] === 0) continue
    out[i] = rgb[0]
    out[i + 1] = rgb[1]
    out[i + 2] = rgb[2]
    out[i + 3] = src[i + 3]
  }
  return out
}

/** 투명한 곳을 배경색으로 채운 새 버퍼 */
export function flattenOnto(
  src: Uint8ClampedArray,
  rgb: readonly [number, number, number],
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(src.length)
  for (let i = 0; i < out.length; i += 4) {
    out[i] = rgb[0]
    out[i + 1] = rgb[1]
    out[i + 2] = rgb[2]
    out[i + 3] = 255
  }
  blendOver(out, src)
  return out
}
