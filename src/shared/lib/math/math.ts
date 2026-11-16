/** 값을 [min, max] 범위로 자릅니다. */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}

/** a에서 b까지 t(0~1)만큼 나아간 값 (선형 보간, Lerp) */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** lerp의 역: value가 a~b 사이 어디쯤인지 0~1로 돌려줍니다. */
export function inverseLerp(a: number, b: number, value: number): number {
  return a === b ? 0 : (value - a) / (b - a)
}

/** 한 범위의 값을 다른 범위로 옮깁니다. 기본으로 결과를 출력 범위 안으로 자릅니다. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clampResult = true,
): number {
  const t = inverseLerp(inMin, inMax, value)
  return lerp(outMin, outMax, clampResult ? clamp(t) : t)
}

/**
 * 프레임 간격(dt, 초)과 상관없이 같은 빠르기로 목표값을 따라가는 lerp입니다.
 * lambda가 클수록 빨리 따라갑니다. (지수 감쇠: 1 - e^(-λ·dt))
 */
export function damp(
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt))
}

/** 경계 사이를 부드럽게 0→1로 잇는 곡선 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp(inverseLerp(edge0, edge1, x))
  return t * t * (3 - 2 * t)
}

/** 0→1→0으로 올라갔다 내려오는 구간 값 (in 구간에서 차오르고 out 구간에서 사라짐) */
export function bell(
  x: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number,
): number {
  return smoothstep(inStart, inEnd, x) * (1 - smoothstep(outStart, outEnd, x))
}

/**
 * 움직임에 쓸 프레임 간격(초).
 * - 필요할 때만 그리는 장면에서 쉬었다 다시 그린 첫 프레임(resumed)은 쉰 시간까지 delta에 들어 있어
 *   한 프레임(1/60초)으로 쳐서 움직임이 한 번에 튀지 않게 합니다.
 * - 이어서 움직이는 동안의 프레임은 느린 기기에서도 실제 시간을 따르도록 0.1초까지 그대로 씁니다.
 */
export function stepDelta(delta: number, resumed = false): number {
  return resumed ? 1 / 60 : Math.min(delta, 0.1)
}
