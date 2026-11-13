import { Fragment } from 'react'
import { cx } from '@/shared/lib/classnames'
import styles from './DisplayHeading.module.css'

export interface DisplayHeadingProps {
  as?: 'h1' | 'h2' | 'h3'
  /** 줄마다 하나씩. 둘째 줄부터 번갈아 들여 씁니다. */
  lines: readonly string[]
  /** 화면에는 숨기고 제목 이름 앞에 붙일 말 (예: 브랜드 이름) */
  prefix?: string
  id?: string
  tone?: 'ink' | 'light' | 'crimson'
  align?: 'start' | 'center'
  lang?: string
  className?: string
}

/** 영문 대문자 두 줄 제목 (둘째 줄 앞에 선) */
export function DisplayHeading({
  as: Heading = 'h2',
  lines,
  prefix,
  id,
  tone = 'ink',
  align = 'start',
  lang = 'en',
  className,
}: DisplayHeadingProps) {
  return (
    <Heading
      id={id}
      lang={lang}
      className={cx(
        styles.heading,
        styles[tone],
        align === 'center' && styles.center,
        className,
      )}
    >
      {prefix ? (
        <>
          <span className="visually-hidden">{prefix}</span>{' '}
        </>
      ) : null}
      {lines.map((line, index) => (
        <Fragment key={line}>
          {/* 줄 사이 공백이 있어야 화면 낭독기가 단어를 붙여 읽지 않습니다. */}
          {index > 0 ? ' ' : null}
          <span className={cx(styles.line, index % 2 === 1 && styles.indent)}>
            {line}
          </span>
        </Fragment>
      ))}
    </Heading>
  )
}
