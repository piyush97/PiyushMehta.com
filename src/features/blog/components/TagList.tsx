// src/features/blog/components/TagList.tsx
interface Props { tags: string[] }
export function TagList({ tags }: Props) {
  return (
    <div className="project-tags">
      {tags.map((tag) => <span key={tag} className="project-tag">{tag}</span>)}
    </div>
  )
}
