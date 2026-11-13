/** 참인 클래스 이름만 공백으로 잇습니다. */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ')
}
