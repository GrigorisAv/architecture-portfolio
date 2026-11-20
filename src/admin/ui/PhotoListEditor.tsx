import { useState } from 'react'
import type { SlotImage } from '../../content/records'
import type { MediaFolder } from '../api/types'
import { useAdmin } from '../AdminContext'
import { gallerySpec, orientationWarning } from '../lib/imageGuide'
import { thumbUrl } from '../lib/thumb'
import { Button, ConfirmButton } from './kit'
import { inputCls } from './kitUtils'
import { MediaPicker } from './MediaPicker'

/**
 * Ordered photo list (e.g. «Το γραφείο»): add, describe, reorder, remove.
 * Positions follow the site's 16:9 → 4:3 → 4:5 rhythm; the next slot's size is shown on the add button.
 */
export function PhotoListEditor({ folder, items, onChange }: { folder: MediaFolder; items: SlotImage[]; onChange: (items: SlotImage[]) => void }) {
  const { api } = useAdmin()
  // Photo proportions, read from the loaded thumbnails (same aspect as the original).
  const [dims, setDims] = useState<Record<string, { w: number; h: number }>>({})
  const move = (i: number, d: -1 | 1) => {
    const next = [...items]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <div className="flex flex-col gap-3" data-photo-list>
      {items.map((img, i) => {
        const spec = gallerySpec(i)
        const d = dims[img.path]
        const mismatch = d ? orientationWarning(spec, d.w, d.h) : null
        return (
          <div key={`${img.path}-${i}`} className="grid gap-3 rounded-lg border border-stone-deep/60 p-3 md:grid-cols-[7rem_1fr_auto]">
            <img
              src={thumbUrl(api.resolveImage(img.path, null))}
              alt=""
              className="h-20 w-28 rounded object-cover"
              onLoad={(e) => {
                const { naturalWidth: w, naturalHeight: h } = e.currentTarget
                setDims((x) => (x[img.path] ? x : { ...x, [img.path]: { w, h } }))
              }}
            />
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold" htmlFor={`photo-alt-${i}`}>
                Περιγραφή φωτογραφίας (alt) {!img.alt.trim() && <span className="ml-1 text-error">· λείπει</span>}
              </label>
              <input id={`photo-alt-${i}`} className={inputCls} value={img.alt} placeholder="π.χ. «Το τραπέζι εργασίας με μακέτες και δείγματα υλικών»" onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} />
              <span className="text-sm text-muted-paper" data-image-slot>
                Θέση {i + 1}: <span className="font-semibold text-ink">{spec.frame}</span> · {spec.ideal}
              </span>
              {mismatch && <p className="text-sm text-bronze-ink" data-fit-warning>⚠ {mismatch} Μετακινήστε τη με τα βελάκια σε θέση που της ταιριάζει.</p>}
            </div>
            <div className="flex items-start gap-1">
              <Button variant="ghost" className="px-2" aria-label="Μετακίνηση πάνω" disabled={i === 0} onClick={() => move(i, -1)}>↑</Button>
              <Button variant="ghost" className="px-2" aria-label="Μετακίνηση κάτω" disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</Button>
              <ConfirmButton label="Αφαίρεση" confirmLabel="Αφαίρεση;" onConfirm={() => onChange(items.filter((_, k) => k !== i))} />
            </div>
          </div>
        )
      })}
      <MediaPicker
        label={items.length ? `Προσθήκη φωτογραφίας (θέση ${items.length + 1})` : 'Προσθήκη πρώτης φωτογραφίας'}
        folder={folder}
        spec={gallerySpec(items.length)}
        path={null}
        warn={false}
        onChange={(p) => p && onChange([...items, { path: p, alt: '' }])}
      />
    </div>
  )
}
