import { ByteWriter } from './byte-writer'

const MAX_CODE = 4096

/**
 * GIF용 가변 길이 LZW 압축. 색 번호 배열을 코드 스트림(하위 블록으로 나누기 전)으로 바꿉니다.
 * 사전이 4096개로 차면 지우기 코드를 내보내고 처음부터 다시 쌓습니다.
 */
export function lzwEncode(
  indices: Uint8Array,
  minCodeSize: number,
): Uint8Array {
  const clearCode = 1 << minCodeSize
  const endCode = clearCode + 1
  const out = new ByteWriter(Math.max(64, indices.length >> 1))

  let codeSize = minCodeSize + 1
  let nextCode = endCode + 1
  // (앞 코드 << 8 | 다음 색) → 코드. 앞 코드는 12비트 이하라 20비트 안에 들어갑니다.
  let dictionary = new Map<number, number>()
  let bitBuffer = 0
  let bitCount = 0

  const emit = (code: number) => {
    bitBuffer |= code << bitCount
    bitCount += codeSize
    while (bitCount >= 8) {
      out.byte(bitBuffer & 0xff)
      bitBuffer >>>= 8
      bitCount -= 8
    }
  }

  emit(clearCode)
  if (indices.length > 0) {
    let prefix = indices[0]
    for (let i = 1; i < indices.length; i += 1) {
      const k = indices[i]
      const key = (prefix << 8) | k
      const known = dictionary.get(key)
      if (known !== undefined) {
        prefix = known
        continue
      }
      emit(prefix)
      if (nextCode === MAX_CODE) {
        emit(clearCode)
        dictionary = new Map()
        nextCode = endCode + 1
        codeSize = minCodeSize + 1
      } else {
        // 해독기는 한 단계 늦게 사전을 채우므로, 다음 코드가 현재 비트 수를 넘을 때 늘립니다.
        if (nextCode >= 1 << codeSize) codeSize += 1
        dictionary.set(key, nextCode)
        nextCode += 1
      }
      prefix = k
    }
    emit(prefix)
  }
  emit(endCode)
  if (bitCount > 0) out.byte(bitBuffer & 0xff)
  return out.toBytes()
}

/**
 * GIF LZW 코드 스트림을 색 번호 배열로 풉니다.
 * 데이터가 모자라거나 잘못된 코드가 나오면 그때까지 푼 값만 남깁니다.
 */
export function lzwDecode(
  data: Uint8Array,
  minCodeSize: number,
  pixelCount: number,
): Uint8Array {
  const output = new Uint8Array(pixelCount)
  const clearCode = 1 << minCodeSize
  const endCode = clearCode + 1

  const prefix = new Int16Array(MAX_CODE)
  const suffix = new Uint8Array(MAX_CODE)
  const first = new Uint8Array(MAX_CODE)
  const length = new Uint16Array(MAX_CODE)
  for (let i = 0; i < clearCode; i += 1) {
    prefix[i] = -1
    suffix[i] = i
    first[i] = i
    length[i] = 1
  }

  let codeSize = minCodeSize + 1
  let nextCode = endCode + 1
  let previous = -1
  let bitBuffer = 0
  let bitCount = 0
  let position = 0
  let written = 0

  const writeCode = (code: number) => {
    const size = length[code]
    let at = written + size - 1
    let current = code
    while (current >= 0) {
      if (at < pixelCount) output[at] = suffix[current]
      at -= 1
      current = prefix[current]
    }
    written += size
  }

  while (written < pixelCount) {
    while (bitCount < codeSize && position < data.length) {
      bitBuffer |= data[position] << bitCount
      position += 1
      bitCount += 8
    }
    if (bitCount < codeSize) break
    const code = bitBuffer & ((1 << codeSize) - 1)
    bitBuffer >>>= codeSize
    bitCount -= codeSize

    if (code === clearCode) {
      codeSize = minCodeSize + 1
      nextCode = endCode + 1
      previous = -1
      continue
    }
    if (code === endCode) break

    if (previous === -1) {
      if (code >= clearCode) break
      writeCode(code)
      previous = code
      continue
    }

    if (code > nextCode || (code === nextCode && nextCode >= MAX_CODE)) break

    const addEntry = (lastChar: number) => {
      if (nextCode >= MAX_CODE) return
      prefix[nextCode] = previous
      suffix[nextCode] = lastChar
      first[nextCode] = first[previous]
      length[nextCode] = length[previous] + 1
      nextCode += 1
      if (nextCode === 1 << codeSize && codeSize < 12) codeSize += 1
    }

    if (code === nextCode) {
      // KwKwK: 방금 만들 항목을 바로 쓰는 경우
      addEntry(first[previous])
      writeCode(code)
    } else {
      writeCode(code)
      addEntry(first[code])
    }
    previous = code
  }
  return output
}
