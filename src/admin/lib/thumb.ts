/** Small preview: smallest uploaded variant, or the bundled 640w JPEG. */
export function thumbUrl(img: { src: string; srcset?: { url: string; width: number }[] }) {
  if (img.srcset?.length) return img.srcset[0].url
  if (/^(https?:|blob:|data:)/.test(img.src)) return img.src
  return `${import.meta.env.BASE_URL}images/${img.src}-640.webp`
}
