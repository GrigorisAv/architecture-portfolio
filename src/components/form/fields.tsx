import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { inputClass } from './fieldUtils'

/** Shared field chrome: visible label, required marker, hint, inline error (linked via aria-describedby). */
interface FieldShellProps {
  id: string
  label: string
  required?: boolean
  hint?: ReactNode
  error?: string
  children: ReactNode
  counter?: ReactNode
}

export function FieldShell({ id, label, required, hint, error, children, counter }: FieldShellProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-semibold tracking-[0.02em] text-ink">
          {label}
          {required ? (
            <span className="ml-1 text-bronze-ink" aria-hidden="true">*</span>
          ) : (
            <span className="ml-2 font-normal text-muted-paper">(προαιρετικό)</span>
          )}
        </label>
        {counter}
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1 text-sm text-muted-paper">{hint}</p>}
      {children}
      <p id={`${id}-error`} className={`mt-2 min-h-[1.25rem] text-sm font-medium text-error ${error ? '' : 'invisible'}`} aria-live="polite">
        {error ? <><span aria-hidden="true">— </span>{error}</> : null}
      </p>
    </div>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement> & { invalid: boolean }) {
  const { invalid, className = '', ...rest } = props
  return <input {...rest} aria-invalid={invalid || undefined} className={`${inputClass(invalid)} ${className}`} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid: boolean }) {
  const { invalid, className = '', ...rest } = props
  return <textarea {...rest} aria-invalid={invalid || undefined} className={`${inputClass(invalid)} min-h-40 resize-y leading-relaxed ${className}`} />
}
