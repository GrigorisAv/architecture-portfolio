import { useRef, useState } from 'react'
import { useAdmin } from '../AdminContext'
import type { MediaFolder } from '../api/types'
import { checkFit, readImageSize, type ImageSpec } from '../lib/imageGuide'
import { FitWarnings, ImageSpecNote } from './ImageSpecNote'
import { thumbUrl } from '../lib/thumb'
import { Button } from './kit'
import { useToast } from './kitUtils'

/** Single image field (service photo, portrait): preview + replace + remove. */
export function MediaPicker({
  label,
  folder,
  path,
  onChange,
  removeLabel = 'Αφαίρεση',
  canRemove = true,
  spec,
}: {
  label: string
  folder: MediaFolder
  path: string | null
  onChange: (path: string | null) => void
  removeLabel?: string
  canRemove?: boolean
  /** Recommended size for this slot: shown above the picker, checked after picking. */
  spec?: ImageSpec
}) {
  const { api } = useAdmin()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const input = useRef<HTMLInputElement>(null)
  const pick = async (file?: File) => {
    if (!file) return
    setBusy(true)
    const size = spec ? await readImageSize(file) : null
    setWarnings(spec && size ? checkFit(spec, size.width, size.height) : [])
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
      {spec && <ImageSpecNote spec={spec} />}
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-24 w-32 overflow-hidden rounded bg-stone">
          {path && <img src={thumbUrl(api.resolveImage(path, null))} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button busy={busy} onClick={() => input.current?.click()}>{path ? 'Αντικατάσταση' : 'Ανέβασμα εικόνας'}</Button>
          {path && canRemove && <Button variant="ghost" onClick={() => { setWarnings([]); onChange(null) }}>{removeLabel}</Button>}
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" aria-label={label} onChange={(e) => pick(e.target.files?.[0])} />
      </div>
      <FitWarnings warnings={warnings} />
    </div>
  )
}
