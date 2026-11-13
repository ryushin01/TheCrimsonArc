/** 필요할 때마다 두 배로 늘어나는 바이트 버퍼 */
export class ByteWriter {
  private buffer: Uint8Array
  private length = 0

  constructor(initialSize = 4096) {
    this.buffer = new Uint8Array(initialSize)
  }

  get size(): number {
    return this.length
  }

  private ensure(extra: number): void {
    const needed = this.length + extra
    if (needed <= this.buffer.length) return
    let next = this.buffer.length * 2
    while (next < needed) next *= 2
    const grown = new Uint8Array(next)
    grown.set(this.buffer.subarray(0, this.length))
    this.buffer = grown
  }

  byte(value: number): void {
    this.ensure(1)
    this.buffer[this.length] = value & 0xff
    this.length += 1
  }

  /** 리틀 엔디언 16비트 */
  u16(value: number): void {
    this.byte(value & 0xff)
    this.byte((value >> 8) & 0xff)
  }

  bytes(values: ArrayLike<number>): void {
    this.ensure(values.length)
    this.buffer.set(values, this.length)
    this.length += values.length
  }

  ascii(text: string): void {
    for (let i = 0; i < text.length; i += 1) this.byte(text.charCodeAt(i))
  }

  toBytes(): Uint8Array {
    return this.buffer.slice(0, this.length)
  }
}
