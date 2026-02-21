interface BranchIndicatorProps {
  branch: string
}

export function BranchIndicator({ branch }: BranchIndicatorProps): JSX.Element {
  return (
    <span className="branch-indicator">
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
        <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Z" />
      </svg>
      {branch}
    </span>
  )
}
