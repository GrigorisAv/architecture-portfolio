/* Admin UI kit: calm, legible, keyboard-friendly. Uses the site tokens, utilitarian density. */
import { useCallback, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { inputCls, ToastCtx, type Toast } from './kitUtils'

/* ---------------- Buttons ---------------- */
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink-raised border-ink',
  secondary: 'bg-white text-ink border-stone-deep hover:border-ink',
  danger: 'bg-white text-error border-error/50 hover:bg-error hover:text-white',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-stone/50',
}
export function Button({ variant = 'secondary', busy, className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    >
      {busy && <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" aria-hidden="true" />}
      {children}
    </button>
  )
}

/* ---------------- Fields ---------------- */
interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string
  required?: boolean
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
}
export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId()
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {required ? <span className="ml-1 text-bronze-ink" aria-hidden="true">*</span> : null}
      </label>
      {hint && <p id={`${id}-hint`} className="text-xs text-muted-paper">{hint}</p>}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error && <p id={`${id}-err`} className="text-sm font-medium text-error">{error}</p>}
    </div>
  )
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-ink' : 'bg-stone-deep'}`}
      >
        <span aria-hidden="true" className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </button>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="block text-xs text-muted-paper">{description}</span>}
      </label>
    </div>
  )
}

/* ---------------- Layout pieces ---------------- */
export function Panel({ title, description, actions, children }: { title?: string; description?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-stone-deep/70 bg-white">
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-deep/60 px-5 py-4">
          <div>
            {title && <h2 className="font-display text-xl">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-paper">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-light tracking-[-0.02em]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-paper">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function StatusBadge({ tone, children }: { tone: 'green' | 'gray' | 'bronze' | 'red'; children: ReactNode }) {
  const map = {
    green: 'bg-[#e6efe6] text-[#2d5a2d]',
    gray: 'bg-stone/60 text-muted-paper',
    bronze: 'bg-[#f1e8dc] text-bronze-ink',
    red: 'bg-[#f5e3e0] text-error',
  }
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[tone]}`}>{children}</span>
}

export function Loading({ label = 'Φόρτωση…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-10 text-muted-paper">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-deep border-t-ink" aria-hidden="true" />
      {label}
    </div>
  )
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-error/40 bg-[#fbf1ef] px-4 py-3 text-sm text-error">
      <span>{message}</span>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Δοκιμή ξανά</Button>}
    </div>
  )
}

/** Two-step destructive action (no browser confirm(): it is unreliable in embedded previews). */
export function ConfirmButton({ label, confirmLabel = 'Οριστική διαγραφή', onConfirm, disabled }: { label: string; confirmLabel?: string; onConfirm: () => Promise<void> | void; disabled?: boolean }) {
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  if (!armed)
    return (
      <Button variant="danger" disabled={disabled} onClick={() => { setArmed(true); timer.current = window.setTimeout(() => setArmed(false), 6000) }}>
        {label}
      </Button>
    )
  return (
    <span className="inline-flex items-center gap-2">
      <Button variant="danger" busy={busy} className="bg-error! text-white!" onClick={async () => { setBusy(true); try { await onConfirm() } finally { setBusy(false); setArmed(false) } }}>
        {confirmLabel}
      </Button>
      <Button variant="ghost" onClick={() => setArmed(false)}>Άκυρο</Button>
    </span>
  )
}

/* ---------------- List editors ---------------- */
export function StringListEditor({ label, items, onChange, multiline, addLabel, hint }: { label: string; items: string[]; onChange: (v: string[]) => void; multiline?: boolean; addLabel: string; hint?: string }) {
  const set = (i: number, v: string) => onChange(items.map((x, k) => (k === i ? v : x)))
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      {hint && <p className="-mt-1 mb-1 text-xs text-muted-paper">{hint}</p>}
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2.5 w-6 text-right text-xs tabular-nums text-muted-paper">{i + 1}.</span>
          {multiline ? (
            <textarea aria-label={`${label} ${i + 1}`} className={`${inputCls} min-h-24`} value={item} onChange={(e) => set(i, e.target.value)} />
          ) : (
            <input aria-label={`${label} ${i + 1}`} className={inputCls} value={item} onChange={(e) => set(i, e.target.value)} />
          )}
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" className="px-2" aria-label={`Μετακίνηση ${i + 1} πάνω`} disabled={i === 0} onClick={() => move(i, -1)}>↑</Button>
            <Button variant="ghost" className="px-2" aria-label={`Μετακίνηση ${i + 1} κάτω`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</Button>
            <Button variant="ghost" className="px-2 text-error" aria-label={`Αφαίρεση ${i + 1}`} onClick={() => onChange(items.filter((_, k) => k !== i))}>✕</Button>
          </div>
        </div>
      ))}
      <div><Button onClick={() => onChange([...items, ''])}>+ {addLabel}</Button></div>
    </fieldset>
  )
}

export function PairListEditor({ label, items, onChange, addLabel }: { label: string; items: { title: string; text: string }[]; onChange: (v: { title: string; text: string }[]) => void; addLabel: string }) {
  const set = (i: number, key: 'title' | 'text', v: string) => onChange(items.map((x, k) => (k === i ? { ...x, [key]: v } : x)))
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      {items.map((item, i) => (
        <div key={i} className="grid gap-2 rounded-md border border-stone-deep/60 p-3 md:grid-cols-[14rem_1fr_auto]">
          <input aria-label={`${label} ${i + 1}: τίτλος`} className={inputCls} value={item.title} placeholder="Τίτλος" onChange={(e) => set(i, 'title', e.target.value)} />
          <textarea aria-label={`${label} ${i + 1}: κείμενο`} className={`${inputCls} min-h-20`} value={item.text} placeholder="Κείμενο" onChange={(e) => set(i, 'text', e.target.value)} />
          <Button variant="ghost" className="self-start text-error" aria-label={`Αφαίρεση ${i + 1}`} onClick={() => onChange(items.filter((_, k) => k !== i))}>✕</Button>
        </div>
      ))}
      <div><Button onClick={() => onChange([...items, { title: '', text: '' }])}>+ {addLabel}</Button></div>
    </fieldset>
  )
}

/* ---------------- Toasts ---------------- */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((tone: Toast['tone'], text: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, tone, text }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 8000 : 4000)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto rounded-md px-4 py-3 text-sm font-medium shadow-lg ${t.tone === 'success' ? 'bg-ink text-paper' : 'bg-error text-white'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

