import { useState } from 'react'
import styles from './ConfigControls.module.css'

export interface ShareLinkProps {
  /** 복사할 주소 */
  url: string
}

/** 지금 조합을 여는 주소를 복사합니다. 결과는 처음부터 있는 상태 영역으로 알립니다. */
export function ShareLink({ url }: ShareLinkProps) {
  const [message, setMessage] = useState('')
  const [count, setCount] = useState(0)

  const copy = async () => {
    let next: string
    try {
      await navigator.clipboard.writeText(url)
      next = '조합 링크를 복사했습니다.'
    } catch {
      next = '링크를 복사하지 못했습니다. 주소 표시줄의 주소를 복사해 주세요.'
    }
    setMessage(next)
    setCount((value) => value + 1)
  }

  return (
    <div>
      <button
        type="button"
        className={styles.button}
        onClick={() => void copy()}
      >
        조합 링크 복사
      </button>
      {/* 같은 문장이 이어져도 다시 읽히도록 보이지 않는 글자를 번갈아 붙입니다. */}
      <p className={styles.status} role="status">
        {message ? `${message}${count % 2 ? '​' : ''}` : ''}
      </p>
    </div>
  )
}
