import styles from './ConfigControls.module.css'

export interface ChronoControlsProps {
  /** 크로노그래프가 도는 중인지 (2시 푸셔 글자가 '정지'로 바뀜) */
  running: boolean
  onStartStop: () => void
  onReset: () => void
  /** 누른 결과 알림 (처음부터 있는 상태 영역의 글만 바꿈) */
  message: string
}

/**
 * 6시 크로노그래프를 직접 써 보는 두 푸셔. 2시는 시작·정지, 4시는 0으로 되돌리기(도는 중이면 플라이백).
 * 버튼 글자가 '시작/정지'로 바뀌므로 aria-pressed는 쓰지 않습니다.
 */
export function ChronoControls({
  running,
  onStartStop,
  onReset,
  message,
}: ChronoControlsProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>크로노그래프</legend>
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.button}
          data-running={running}
          onClick={onStartStop}
        >
          <span className={styles.position}>2시 푸셔</span>{' '}
          {running ? '정지' : '시작'}
        </button>
        <button type="button" className={styles.button} onClick={onReset}>
          <span className={styles.position}>4시 푸셔</span> 초기화
        </button>
      </div>
      <p className={styles.status} role="status">
        {message}
      </p>
    </fieldset>
  )
}
