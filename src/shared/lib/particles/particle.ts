/** 입자에 작용하는 힘. 모두 60fps 한 프레임 기준 값입니다. */
export interface ParticleForces {
  /** 마우스가 밀어내는 반경(px) */
  radius: number
  /** 반경 가운데에서 밀어내는 세기 */
  repulsion: number
  /** 제자리(목표점)로 당기는 복원력 비율 */
  spring: number
  /** 프레임마다 남기는 속도 비율 (작을수록 빨리 멈춤) */
  friction: number
}

export const DEFAULT_FORCES: Readonly<ParticleForces> = {
  radius: 90,
  repulsion: 5,
  spring: 0.055,
  friction: 0.84,
}

export interface PointerLike {
  x: number
  y: number
  active: boolean
}

/** 목표점을 향해 돌아가면서 마우스를 피하는 입자 하나 */
export class Particle {
  x: number
  y: number
  vx = 0
  vy = 0
  tx: number
  ty: number
  /** 0~1 사이 고정 난수: 크기와 색을 고르는 데 씁니다. */
  readonly seed: number

  constructor(x: number, y: number, seed = Math.random()) {
    this.x = x
    this.y = y
    this.tx = x
    this.ty = y
    this.seed = seed
  }

  setTarget(x: number, y: number): void {
    this.tx = x
    this.ty = y
  }

  /**
   * step은 60fps 한 프레임을 1로 둔 경과 시간입니다. (dt × 60)
   * 1. 마우스와의 유클리드 거리가 반경보다 가까우면 가까울수록 세게 바깥으로 밉니다.
   * 2. 목표점과의 차이에 비례하는 복원력으로 당깁니다.
   * 3. 마찰로 속도를 줄여 출렁임이 가라앉게 합니다.
   */
  update(pointer: PointerLike, forces: ParticleForces, step = 1): void {
    if (pointer.active) {
      const dx = this.x - pointer.x
      const dy = this.y - pointer.y
      const distanceSq = dx * dx + dy * dy
      if (distanceSq < forces.radius * forces.radius && distanceSq > 1e-6) {
        const distance = Math.sqrt(distanceSq)
        const strength = (1 - distance / forces.radius) * forces.repulsion
        this.vx += (dx / distance) * strength * step
        this.vy += (dy / distance) * strength * step
      }
    }
    this.vx += (this.tx - this.x) * forces.spring * step
    this.vy += (this.ty - this.y) * forces.spring * step
    const damping = Math.pow(forces.friction, step)
    this.vx *= damping
    this.vy *= damping
    this.x += this.vx * step
    this.y += this.vy * step
  }
}
