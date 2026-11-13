/** 3D 무대가 매 프레임 계산한 화면 좌표. 소개 섹션의 지시선이 이 점을 가리킵니다. */
export const ANCHOR_COUNT = 4

const points = Array.from({ length: ANCHOR_COUNT }, () => ({
  x: 0,
  y: 0,
  visible: false,
}))

export const anchorStore = {
  get(index: number): Readonly<{ x: number; y: number; visible: boolean }> {
    return points[index]
  },
  set(index: number, x: number, y: number, visible: boolean): void {
    const point = points[index]
    if (!point) return
    point.x = x
    point.y = y
    point.visible = visible
  },
  hideAll(): void {
    for (const point of points) point.visible = false
  },
}
