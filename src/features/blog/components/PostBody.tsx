// src/features/blog/components/PostBody.tsx
// MDX is compiled at build time by @mdx-js/rollup.
// The Component is a standard React component — render it directly.
import type { ComponentType } from 'react'

interface Props { Component: ComponentType }
export function PostBody({ Component }: Props) {
  return <div className="prose"><Component /></div>
}
