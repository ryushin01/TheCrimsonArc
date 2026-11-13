import type { ReactNode } from 'react'

interface IconDefinition {
  body: ReactNode
  /** 면으로 채우는 아이콘 */
  fill?: boolean
}

const ICONS = {
  'arrow-right': { body: <path d="M4 12h15M13 6l6 6-6 6" /> },
  'arrow-up-right': { body: <path d="M7 17 17 7M8 7h9v9" /> },
  pen: {
    body: (
      <>
        <path d="M4 20l1.2-4.6L15.8 4.8a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z" />
        <path d="M13.5 7l3.5 3.5" />
      </>
    ),
  },
  eraser: {
    body: (
      <>
        <path d="M3.6 14.4 12.6 5.4a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L10 20H7l-3.4-3.4a1.5 1.5 0 0 1 0-2.2z" />
        <path d="M9 9l6 6M10 20h10" />
      </>
    ),
  },
  fill: {
    body: (
      <>
        <path d="M5 11 11.5 4.5l7 7L12 18a2 2 0 0 1-2.8 0L5 13.8a2 2 0 0 1 0-2.8z" />
        <path d="M4.6 12.4h13.6M20 15s1.5 2 1.5 3a1.5 1.5 0 0 1-3 0c0-1 1.5-3 1.5-3z" />
      </>
    ),
  },
  picker: {
    body: (
      <>
        <path d="M14.5 4.5a2.1 2.1 0 0 1 3 0l2 2a2.1 2.1 0 0 1 0 3L17 12l-5-5z" />
        <path d="M12.5 7.5 5 15v4h4l7.5-7.5" />
      </>
    ),
  },
  eye: {
    body: (
      <>
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  plus: { body: <path d="M12 5v14M5 12h14" /> },
  copy: {
    body: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="1.5" />
        <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
      </>
    ),
  },
  trash: {
    body: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  },
  'chevron-up': { body: <path d="M6 15l6-6 6 6" /> },
  'chevron-down': { body: <path d="M6 9l6 6 6-6" /> },
  'chevron-left': { body: <path d="M15 6l-6 6 6 6" /> },
  'chevron-right': { body: <path d="M9 6l6 6-6 6" /> },
  play: { body: <path d="M7 4.5v15l12-7.5z" />, fill: true },
  pause: { body: <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />, fill: true },
  stop: { body: <rect x="6" y="6" width="12" height="12" />, fill: true },
  undo: {
    body: (
      <>
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
      </>
    ),
  },
  redo: {
    body: (
      <>
        <path d="M15 14l5-5-5-5" />
        <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
      </>
    ),
  },
  download: { body: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" /> },
  upload: { body: <path d="M12 16V5M7 10l5-5 5 5M5 20h14" /> },
  image: {
    body: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
        <circle cx="9" cy="10" r="1.8" />
        <path d="M20.5 16l-5-5L5 19.5" />
      </>
    ),
  },
  layers: {
    body: (
      <>
        <path d="M12 4 3 8.5l9 4.5 9-4.5z" />
        <path d="M3 12.5l9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
      </>
    ),
  },
  film: {
    body: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="1" />
        <path d="M8 4.5v15M16 4.5v15M3.5 9H8M3.5 15H8M16 9h4.5M16 15h4.5" />
      </>
    ),
  },
  grid: {
    body: <path d="M4 4h16v16H4zM4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16" />,
  },
  close: { body: <path d="M6 6l12 12M18 6 6 18" /> },
  menu: { body: <path d="M4 7h16M4 12h16M4 17h16" /> },
  sparkle: {
    body: (
      <path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" />
    ),
    fill: true,
  },
  'file-new': {
    body: (
      <>
        <path d="M13.5 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z" />
        <path d="M13.5 3.5v5h5M12 11.5v6M9 14.5h6" />
      </>
    ),
  },
  'zoom-in': {
    body: (
      <>
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="M15 15l5 5M10.5 8v5M8 10.5h5" />
      </>
    ),
  },
  'zoom-out': {
    body: (
      <>
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="M15 15l5 5M8 10.5h5" />
      </>
    ),
  },
  onion: {
    body: (
      <>
        <circle cx="9.5" cy="12" r="5.5" />
        <circle cx="14.5" cy="12" r="5.5" strokeDasharray="2 2.2" />
      </>
    ),
  },
  sliders: {
    body: (
      <>
        <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="10" cy="12" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
  },
} satisfies Record<string, IconDefinition>

export type IconName = keyof typeof ICONS

export const ICON_NAMES = Object.keys(ICONS) as IconName[]

export interface IconProps {
  name: IconName
  size?: number
  className?: string
}

/** 꾸밈용 아이콘. 항상 보조기기에서 숨기므로 버튼에는 글자나 aria-label을 함께 쓰세요. */
export function Icon({ name, size = 20, className }: IconProps) {
  const icon: IconDefinition = ICONS[name]
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
      fill={icon.fill ? 'currentColor' : 'none'}
      stroke={icon.fill ? 'none' : 'currentColor'}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon.body}
    </svg>
  )
}
