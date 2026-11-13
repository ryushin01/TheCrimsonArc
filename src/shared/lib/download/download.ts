/** 파일을 내려받게 합니다. 사용자가 누른 버튼에서만 부르세요. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** 1234 → '1.2 KB' */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/** 파일 이름으로 쓸 수 없는 글자를 바꿉니다. */
export function toFileName(name: string, extension: string): string {
  const base =
    name
      .trim()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[\\/:*?"<>|\s]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'crimson-arc'
  return `${base}.${extension}`
}
