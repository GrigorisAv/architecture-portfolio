import type { ReactNode } from 'react'

/** Splits plain text into word spans for the scroll-linked brightening effect. Screen readers read the text normally. */
export function Words({ text, italic }: { text: string; italic?: boolean }): ReactNode {
  const words = text.split(' ')
  return words.map((w, i) => (
    <span key={i} data-word className={italic ? 'italic' : undefined}>
      {w}
      {i < words.length - 1 ? ' ' : ''}
    </span>
  ))
}
