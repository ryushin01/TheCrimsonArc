import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface ErrorBoundaryProps {
  /** 오류가 나면 대신 보여 줄 것 (기본: 아무것도 안 보임) */
  fallback?: ReactNode
  onError?: (error: Error) => void
  children: ReactNode
}

interface State {
  failed: boolean
}

/** 꾸밈 요소(3D 무대 등)가 실패해도 페이지 나머지는 그대로 쓰게 합니다. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    this.props.onError?.(error)
  }

  render(): ReactNode {
    return this.state.failed
      ? (this.props.fallback ?? null)
      : this.props.children
  }
}
