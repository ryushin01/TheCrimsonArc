const DB_NAME = 'crimson-arc'
const STORE = 'handoff'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB를 쓸 수 없습니다.'))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB 열기 실패'))
  })
}

/** IndexedDB에 넣는 모양. Blob 대신 바이트로 둡니다. */
interface StashedFile {
  bytes: ArrayBuffer
  type: string
  name: string | null
  lastModified: number
}

function isStashedFile(value: unknown): value is StashedFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as StashedFile).bytes instanceof ArrayBuffer
  )
}

/**
 * 다른 페이지로 넘겨줄 파일을 잠시 맡깁니다. (예: 홍보 페이지에서 연 이미지를 스튜디오로)
 * Safari 비공개 창처럼 IndexedDB에 Blob을 넣지 못하는 곳이 있어, 바이트(ArrayBuffer)와 이름·형식만 저장합니다.
 * 성공하면 true를 돌려줍니다.
 */
export async function stashBlob(key: string, blob: Blob): Promise<boolean> {
  try {
    const record: StashedFile = {
      bytes: await blob.arrayBuffer(),
      type: blob.type,
      name: blob instanceof File ? blob.name : null,
      lastModified: blob instanceof File ? blob.lastModified : Date.now(),
    }
    const db = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(record, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('저장 실패'))
      tx.onabort = () => reject(tx.error ?? new Error('저장 취소'))
    })
    db.close()
    return true
  } catch {
    return false
  }
}

/** 맡긴 파일을 꺼내고 지웁니다. 이름이 있었으면 File로, 없으면 Blob으로 돌려줍니다. 없으면 null */
export async function takeStashedBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openDatabase()
    const value = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const request = store.get(key)
      request.onsuccess = () => {
        store.delete(key)
        resolve(request.result)
      }
      tx.onerror = () => reject(tx.error ?? new Error('읽기 실패'))
    })
    db.close()
    if (value instanceof Blob) return value
    if (!isStashedFile(value)) return null
    return value.name === null
      ? new Blob([value.bytes], { type: value.type })
      : new File([value.bytes], value.name, {
          type: value.type,
          lastModified: value.lastModified,
        })
  } catch {
    return null
  }
}
