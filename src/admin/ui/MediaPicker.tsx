import { useRef, useState } from 'react'
import { useAdmin } from '../AdminContext'
import { thumbUrl } from '../lib/thumb'
import { Button } from './kit'
import { useToast } from './kitUtils'

/** Single image field (service photo, portrait): preview + replace + remove. */
export function MediaPicker({ label, folder, path, onChange }: { label: string; folder: 'services' | 'about'; path: string | null; onChange: (path: string | null) => void }) {
  const { api } = useAdmin()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const pick = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const r = await api.uploadMedia(folder, file)
      onChange(r.path)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Το ανέβασμα απέτυχε.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-24 w-32 overflow-hidden rounded bg-stone">
          {path && <img src={thumbUrl(api.resolveImage(path, null))} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button busy={busy} onClick={() => input.current?.click()}>{path ? 'Αντικατάσταση' : 'Ανέβασμα εικόνας'}</Button>
          {path && <Button variant="ghost" onClick={() => onChange(null)}>Αφαίρεση</Button>}
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" aria-label={label} onChange={(e) => pick(e.target.files?.[0])} />
      </div>
    </div>
  )
}
