import { memo } from 'react'

/**
 * 인트로의 조디악 다이얼. 시계 문자판을 천문 원반처럼 그린 장식이라 모두 보조기기에서 숨깁니다.
 * 세 겹으로 나눠 따로 돌립니다(각 겹은 HTML 요소라 회전을 합성 단계에서 처리합니다).
 * - DialRing: 고정된 바깥 링. 분 눈금, 처음 15분의 크림슨 호(이름의 유래), 로마 숫자
 * - DialSky: 반대 방향으로 아주 느리게 도는 천문 원반. 열두 구획선, 기울어진 황도, 별
 * - DialOrbit: 시계 열두 점이 놓이는 궤도. 시계와 함께 시계 방향으로 돕니다.
 * 좌표는 다이얼 지름을 1000으로 둔 값이고, 궤도 반지름(ORBIT_RADIUS)은 CSS의 --orbit과 맞춥니다.
 */
const VIEW_BOX = '-500 -500 1000 1000'
/** 시계가 놓이는 궤도 반지름 (다이얼 지름 1000 기준). Intro.module.css의 --orbit(0.3)과 같습니다. */
export const ORBIT_RADIUS = 300
const NUMERALS = [
  'XII',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
]

/** 늘 같은 별자리가 나오도록 정해진 씨앗으로 만드는 의사 난수 (mulberry32) */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Star {
  x: number
  y: number
  r: number
  o: number
}

/** 가운데 글자 영역(반지름 200)을 비워 두고 바깥 원반에 별을 흩뿌립니다. */
const STARS: readonly Star[] = (() => {
  const random = seededRandom(0xa01)
  return Array.from({ length: 84 }, () => {
    const angle = random() * Math.PI * 2
    const radius = 215 + Math.sqrt(random()) * 270
    return {
      x: Math.round(Math.cos(angle) * radius * 10) / 10,
      y: Math.round(Math.sin(angle) * radius * 10) / 10,
      r: Math.round((0.8 + random() * 1.8) * 10) / 10,
      o: Math.round((0.25 + random() * 0.6) * 100) / 100,
    }
  })
})()

interface LayerProps {
  className?: string
}

export const DialRing = memo(function DialRing({ className }: LayerProps) {
  return (
    <svg
      className={className}
      viewBox={VIEW_BOX}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor">
        <circle r={492} strokeOpacity={0.22} />
        <circle r={430} strokeOpacity={0.32} />
        <circle r={380} strokeOpacity={0.18} strokeDasharray="2 10" />
      </g>
      {/* 비행 시간을 재는 처음 15분: 12시에서 3시까지의 크림슨 호 */}
      <path
        d="M 0 -460 A 460 460 0 0 1 460 0"
        fill="none"
        stroke="var(--c-crimson-bright)"
        strokeWidth={12}
      />
      <g stroke="currentColor" strokeLinecap="round">
        {Array.from({ length: 60 }, (_, minute) => {
          const major = minute % 5 === 0
          return (
            <line
              key={minute}
              y1={-474}
              y2={major ? -440 : -452}
              strokeWidth={major ? 3 : 1.4}
              strokeOpacity={major ? 0.9 : 0.5}
              transform={`rotate(${minute * 6})`}
            />
          )
        })}
      </g>
      <g fill="currentColor" fillOpacity={0.78} fontSize={21}>
        {NUMERALS.map((numeral, hour) => (
          <text
            key={numeral}
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${hour * 30}) translate(0 -405)`}
          >
            {numeral}
          </text>
        ))}
      </g>
    </svg>
  )
})

export const DialSky = memo(function DialSky({ className }: LayerProps) {
  return (
    <svg
      className={className}
      viewBox={VIEW_BOX}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor">
        {/* 열두 구획(하우스)의 경계: 시계와 시계 사이를 지납니다. */}
        {Array.from({ length: 12 }, (_, house) => (
          <line
            key={house}
            y1={-205}
            y2={-375}
            strokeOpacity={0.16}
            transform={`rotate(${house * 30 + 15})`}
          />
        ))}
        <circle r={200} strokeOpacity={0.26} />
        <circle r={210} strokeOpacity={0.12} />
        {/* 지구 자전축 기울기(23.44°)만큼 기운 황도 */}
        <ellipse
          rx={392}
          ry={142}
          strokeOpacity={0.2}
          strokeDasharray="1 7"
          strokeLinecap="round"
          transform="rotate(-23.44)"
        />
      </g>
      <g fill="currentColor">
        {STARS.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fillOpacity={star.o}
          />
        ))}
      </g>
    </svg>
  )
})

export const DialOrbit = memo(function DialOrbit({ className }: LayerProps) {
  return (
    <svg
      className={className}
      viewBox={VIEW_BOX}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor">
        <circle r={ORBIT_RADIUS} strokeOpacity={0.3} strokeDasharray="4 6" />
        {/* 시계가 놓이는 받침 */}
        {Array.from({ length: 12 }, (_, hour) => (
          <circle
            key={hour}
            r={60}
            cy={-ORBIT_RADIUS}
            strokeOpacity={0.14}
            transform={`rotate(${hour * 30})`}
          />
        ))}
      </g>
    </svg>
  )
})
