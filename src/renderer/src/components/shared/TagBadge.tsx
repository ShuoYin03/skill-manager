interface TagBadgeProps {
  tag: string
}

export function TagBadge({ tag }: TagBadgeProps): JSX.Element {
  return <span className="tag-badge">{tag}</span>
}
