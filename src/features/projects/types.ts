// src/features/projects/types.ts
export interface Project {
  id: string
  title: string
  description: string
  url: string
  github?: string
  tags: string[]
  logo: string
  color: string
}
