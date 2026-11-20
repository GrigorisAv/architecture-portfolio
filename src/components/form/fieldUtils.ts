export function describedBy(id: string, hint?: unknown, error?: string) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
}

const inputBase =
  'mt-2 w-full border-0 border-b bg-transparent px-0 py-3 text-lg text-ink placeholder:text-muted-paper/70 transition-[border-color,box-shadow] duration-300 focus:outline-none focus-visible:outline-none'

export function inputClass(invalid: boolean) {
  return `${inputBase} ${invalid ? 'border-error shadow-[0_1px_0_0_var(--color-error)]' : 'border-stone-deep focus:border-ink focus:shadow-[0_1px_0_0_var(--color-ink)]'}`
}

