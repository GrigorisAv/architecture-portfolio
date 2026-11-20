/** Greek → Latin (ELOT 743-like) slug: "Οικία στο Φως" → "oikia-sto-fos". */
const MAP: Record<string, string> = {
  α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o',
  π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o',
}
const DIGRAPHS: [RegExp, string][] = [
  [/ου/g, 'ou'], [/αυ(?=[θκξπσςτφχψ]|$)/g, 'af'], [/αυ/g, 'av'], [/ευ(?=[θκξπσςτφχψ]|$)/g, 'ef'], [/ευ/g, 'ev'],
  [/μπ/g, 'b'], [/ντ/g, 'nt'], [/γκ/g, 'gk'], [/γγ/g, 'ng'],
]

export function slugify(input: string): string {
  let s = input.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  for (const [re, rep] of DIGRAPHS) s = s.replace(re, rep)
  s = [...s].map((ch) => MAP[ch] ?? ch).join('')
  return s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export const isValidSlug = (s: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)
