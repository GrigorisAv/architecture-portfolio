import { useEffect, useRef, useState } from 'react'

/**
 * Draw-to-sign pad (mouse, touch, pen). Produces a transparent PNG data URL; `null` while empty.
 * Keyboard users can type their name instead (the parent offers that alternative).
 */
export function SignaturePad({ onChange, label }: { onChange: (png: string | null) => void; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [empty, setEmpty] = useState(true)

  // Crisp lines on high-density screens.
  useEffect(() => {
    const c = canvas.current!
    const ratio = Math.max(1, Math.min(3, window.devicePixelRatio || 1))
    const { width, height } = c.getBoundingClientRect()
    c.width = Math.round(width * ratio)
    c.height = Math.round(height * ratio)
    const ctx = c.getContext('2d')!
    ctx.scale(ratio, ratio)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.2
    ctx.strokeStyle = '#191919'
  }, [])

  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const down = (e: React.PointerEvent) => {
    e.preventDefault()
    canvas.current!.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = point(e)
    const ctx = canvas.current!.getContext('2d')!
    ctx.beginPath()
    ctx.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2)
    ctx.fillStyle = '#191919'
    ctx.fill()
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return
    const p = point(e)
    const ctx = canvas.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    setEmpty(false)
    onChange(canvas.current!.toDataURL('image/png'))
  }
  const clear = () => {
    const c = canvas.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setEmpty(true)
    onChange(null)
  }

  return (
    <div>
      <div className="relative rounded-md border border-stone-deep bg-white">
        <canvas
          ref={canvas}
          role="img"
          aria-label={label}
          className="block h-44 w-full touch-none cursor-crosshair"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          data-signature-pad
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 bottom-10 border-b border-dashed border-stone-deep" />
        {empty && <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-paper">Υπογράψτε εδώ με το δάχτυλο ή το ποντίκι</span>}
      </div>
      <button type="button" onClick={clear} className="mt-2 text-sm underline underline-offset-4 disabled:opacity-40" disabled={empty}>
        Καθαρισμός υπογραφής
      </button>
    </div>
  )
}
