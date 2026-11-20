import { useCallback, useEffect, useRef } from 'react'
import type { ImageAsset } from '../../content/types'
import { gsap, prefersReducedMotion } from '../../lib/gsap'
import { Picture } from '../media/Picture'

interface LightboxProps {
  images: ImageAsset[]
  index: number | null
  onChange: (index: number | null) => void
  title: string
}

/**
 * Fullscreen photo viewer on the native <dialog> (built-in focus containment + Escape).
 * Arrow keys / buttons navigate; focus returns to the thumbnail that opened it.
 */
export function Lightbox({ images, index, onChange, title }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const open = index !== null

  const close = useCallback(() => onChange(null), [onChange])
  const step = useCallback(
    (dir: 1 | -1) => {
      if (index === null) return
      onChange((index + dir + images.length) % images.length)
    },
    [index, images.length, onChange],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      openerRef.current = document.activeElement as HTMLElement
      dialog.showModal()
      document.documentElement.style.overflow = 'hidden'
      if (!prefersReducedMotion()) gsap.fromTo(dialog, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' })
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onClose = () => {
      document.documentElement.style.overflow = ''
      gsap.set(dialog, { clearProps: 'opacity,visibility' })
      openerRef.current?.focus()
      onChange(null)
    }
    dialog.addEventListener('close', onClose)
    return () => dialog.removeEventListener('close', onClose)
  }, [onChange])

  // Animate image swaps
  useEffect(() => {
    if (index === null || prefersReducedMotion()) return
    const img = dialogRef.current?.querySelector('[data-lightbox-image]')
    if (img) gsap.fromTo(img, { autoAlpha: 0, scale: 0.985 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'expo.out' })
  }, [index])

  useEffect(() => () => { document.documentElement.style.overflow = '' }, [])

  const current = index !== null ? images[index] : null

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Φωτογραφίες: ${title}`}
      className="lightbox m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 text-paper backdrop:bg-ink/95"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') step(1)
        if (e.key === 'ArrowLeft') step(-1)
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      {current && (
        <div className="flex h-full flex-col">
          <div className="page-x flex items-center justify-between py-5">
            <p className="eyebrow text-muted-ink" aria-live="polite">
              {String((index ?? 0) + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
            </p>
            <button type="button" onClick={close} className="btn btn-ghost-light min-h-11 px-5" autoFocus>
              Κλείσιμο
            </button>
          </div>
          <div className="relative min-h-0 flex-1 px-[var(--spacing-gutter)]">
            <div data-lightbox-image className="relative h-full w-full">
              <Picture image={current} sizes="100vw" blur={false} className="absolute inset-0" imgClassName="h-full w-full object-contain" />
            </div>
          </div>
          <div className="page-x flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-sm text-stone">{current.alt}</p>
            {images.length > 1 && (
              <div className="flex gap-2">
                <button type="button" onClick={() => step(-1)} className="btn btn-ghost-light min-h-11 px-5" aria-label="Προηγούμενη φωτογραφία">
                  Προηγούμενη
                </button>
                <button type="button" onClick={() => step(1)} className="btn btn-ghost-light min-h-11 px-5" aria-label="Επόμενη φωτογραφία">
                  Επόμενη
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}
