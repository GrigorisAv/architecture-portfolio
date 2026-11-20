import { createContext, useContext, useEffect } from 'react'

export const inputCls = 'w-full rounded-md border border-stone-deep bg-white px-3 py-2.5 text-[0.95rem] text-ink placeholder:text-muted-paper/60 focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink aria-[invalid=true]:border-error'

export interface Toast { id: number; tone: 'success' | 'error'; text: string }
export const ToastCtx = createContext<(tone: Toast['tone'], text: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)


/* ---------------- Unsaved changes ---------------- */
export function useBeforeUnload(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])
}

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('el-GR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
