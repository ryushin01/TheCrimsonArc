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

/**
 * 다른 페이지로 넘겨줄 파일을 잠시 맡깁니다. (예: 홍보 페이지에서 연 이미지를 스튜디오로)
 * 성공하면 true를 돌려줍니다.
 */
export async function stashBlob(key: string, blob: Blob): Promise<boolean> {
  try {
    const db = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(blob, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('저장 실패'))
    })
    db.close()
    return true
  } catch {
    return false
  }
}

/** 맡긴 파일을 꺼내고 지웁니다. 없으면 null */
export async function takeStashedBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openDatabase()
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const request = store.get(key)
      request.onsuccess = () => {
        store.delete(key)
        resolve(request.result instanceof Blob ? request.result : null)
      }
      tx.onerror = () => reject(tx.error ?? new Error('읽기 실패'))
    })
    db.close()
    return blob
  } catch {
    return null
  }
}
