export function stripMdx(s: string): string {
  return s
    .replace(/^import .*$/gm, '')
    .replace(/^export .*$/gm, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*`]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
