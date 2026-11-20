# DS Architect — Design System (Master)

> **Source of truth for every visual change.**
> Before building or changing a page, read this file, then check `pages/<page>.md`.
> If a page file exists, its rules override this Master for that page only.
> Implementation lives in `src/styles/tokens.css` (CSS custom properties + Tailwind `@theme`).
> Any change here must be mirrored there, and vice versa.

---

## 0. Provenance — how the UI UX Pro Max skill shaped this system

Generated with the `ui-ux-pro-max` skill (v2.15.0). Raw, unedited output is kept in
`skill-output/` (`MASTER.generated.md`, `tokens.generated.*`).

| Query | Result | Decision |
|---|---|---|
| `"luxury architecture portfolio editorial minimal" --design-system` | Swiss Minimalism, slate grey + safety orange, Archivo / Space Grotesk | **Rejected**: industrial/SaaS mood, wrong for luxury architecture |
| `"architecture interior design studio luxury" --design-system --variance 7 --motion 7 --density 2` | **Exaggerated Minimalism**, Portfolio Grid, monochrome + gold accent, Cinzel / Josefin Sans | **Adopted as base** (style, pattern, palette strategy, spacious density) |
| `"architecture interior design" --domain product` | Architecture / Interior → Exaggerated Minimalism + 3D, secondary *Parallax Storytelling*, "Monochrome + Gold Accent + High Imagery" | Confirms style + justifies the 3D scroll gallery |
| `"luxury editorial serif" --domain typography` | Playfair/Source Serif, Playfair/Inter, Cormorant/Montserrat | Direction (high-contrast serif + quiet sans) adopted; families rejected (no full Greek) |
| `"greek serif display"`, `"greek sans serif"`, family checks `--domain google-fonts` | Noto Serif Display (greek, greek-ext, variable wght/wdth); Manrope (greek, variable wght) | **Adopted**: Noto Serif Display + Manrope |
| `"scroll pin 3d perspective" --domain gsap` | Scroll Reveal (Complex): scrub 0.5–1.5, pin ≤ 1–2 sections, refresh after images/fonts, reduced-motion final state | **Adopted as motion rules** |
| `--domain ux`: reduced motion, focus states, smooth scroll, lazy loading, font loading | Respect `prefers-reduced-motion`, visible focus ring (≥2px, 3:1), smooth anchor scroll, lazy-load below the fold, no font layout shift | **Adopted** |
| `--stack react`: effect cleanup | Return cleanup for subscriptions/timers | Enforced via `useGSAP` scoped contexts |

**Why Cinzel / Josefin Sans were replaced:** neither ships Greek glyphs, and the whole site is Greek.
Cinzel is also all-caps classical, which reads "real estate", not "contemporary atelier".

---

## 1. Concept

**THE ART OF SPACE — Η τέχνη του χώρου.**
A digital architecture monograph: oversized serif type, deep negative space, asymmetric
grids, cinematic photography, and motion that behaves like a camera moving through space.
Calm, never loud.

**Style:** Exaggerated Minimalism (skill), softened with Mediterranean warmth
(ivory paper, stone, bronze). No gradients beyond photographic scrims. No cards with shadows.
Hairline rules instead of boxes.

---

## 2. Color

The user's base palette, evolved with the skill's "monochrome + metallic accent" strategy and
AA-verified pairs. The skill's gold `#A16207` was replaced by a bronze family that matches the brief.

| Token | Hex | Role |
|---|---|---|
| `--color-ink` | `#191919` | Deep Charcoal: dark surfaces, primary text on light |
| `--color-ink-raised` | `#222120` | Raised dark surface (menu overlay, nav fill base) |
| `--color-paper` | `#F5F2EB` | Warm Ivory: main light background |
| `--color-white` | `#FFFFFF` | Highlights, form fields on paper |
| `--color-stone` | `#D8D1C5` | Natural Stone: secondary surfaces, hairlines on dark |
| `--color-stone-deep` | `#B9B0A2` | Hairlines / dividers on paper |
| `--color-bronze` | `#A28B71` | Muted Bronze: accent on **dark** only, decorative on light |
| `--color-bronze-light` | `#C2AE94` | Small accent text on dark |
| `--color-bronze-ink` | `#6A5440` | Bronze **text** on paper *and* stone (AA) |
| `--color-muted-paper` | `#5E5850` | Secondary text on paper |
| `--color-muted-ink` | `#A8A196` | Secondary text on ink |
| `--color-error` | `#9B2C1F` | Validation errors on paper |

**Verified contrast (WCAG 2.x):**

| Pair | Ratio | Use |
|---|---|---|
| paper on ink | 15.73 | Body/headings on dark |
| ink on paper | 15.73 | Body/headings on light |
| stone on ink | 11.59 | Secondary on dark |
| muted-ink on ink | 6.87 | Captions on dark |
| bronze-light on ink | 8.18 | Eyebrows on dark |
| bronze on ink | 5.41 | Accent text on dark |
| ink on bronze | 5.41 | Primary CTA (bronze fill) |
| muted-paper on paper | 6.29 | Captions on light |
| bronze-ink on paper | 6.36 | Eyebrows on light |
| bronze-ink on stone | 4.69 | Eyebrows on stone sections (was #735C45 = 4.13 ✗, fixed in Phase 4 after Lighthouse) |
| muted-paper on stone | 4.63 | Captions on stone sections |
| bronze on paper | **2.90 ✗** | Never text. Rules/ornaments only |

**Project tints (3D gallery):** each project carries a `tint` generated by `npm run images`:
the photo's average hue at HSL lightness 17%, saturation ×2.4 (clamped 12–42%), mixed 15% toward
warm ink `#1B1815`. Current range: slate `#222B2F` → sage `#242D29` → umber `#2F2922` → bronze `#392A18`.
Verified: paper ≥ 12.3:1, stone ≥ 9.1:1, bronze-light ≥ 6.4:1. On tints use **stone** (not muted-ink)
for secondary text.

---

## 3. Typography

| Role | Family | Fallback |
|---|---|---|
| Display / headings | **Noto Serif Display Variable** (wght 100–900, italic) | `'Noto Serif Display Fallback'` (metric-matched Times New Roman), `Georgia, serif` |
| Body / UI / navigation | **Manrope Variable** (wght 200–800) | `'Manrope Fallback'` (metric-matched Arial), `system-ui, sans-serif` |

Self-hosted via `@fontsource-variable/*` (no Google Fonts runtime dependency → portable hosting,
GDPR-friendly). Subsets load lazily via `unicode-range`; Greek is included.

**Scale (fluid, `clamp`)**

| Token | Size | Line-height | Tracking | Use |
|---|---|---|---|---|
| `--text-hero` | `clamp(3.25rem, 9.5vw, 11rem)` | 0.92 | -0.035em | Hero statement (weight 300) |
| `--text-display` | `clamp(2.75rem, 6.4vw, 7rem)` | 0.98 | -0.03em | Section statements |
| `--text-h2` | `clamp(2rem, 4vw, 4rem)` | 1.05 | -0.02em | Section titles |
| `--text-h3` | `clamp(1.5rem, 2.2vw, 2.25rem)` | 1.15 | -0.01em | Sub-titles, project names |
| `--text-lead` | `clamp(1.125rem, 1.4vw, 1.375rem)` | 1.6 | 0 | Intro paragraphs |
| body | `1rem`–`1.0625rem` | 1.7 | 0 | Body (min 16px) |
| `--text-eyebrow` | `0.75rem` | 1.4 | 0.22em, uppercase | Labels, indices |

Rules:
- Headings use **light (300) to regular (400)** serif weights. Elegance comes from scale, not weight.
  The skill's "font-weight 900" note for Exaggerated Minimalism is deliberately *not* applied.
- Accent words in headings: serif *italic*, never colored on light backgrounds.
- Greek uppercase drops accents (τόνοι). Use `text-transform: uppercase` with `lang="el"` so browsers handle it,
  and never hand-type accented capitals in eyebrows.
- Body text ≥ 16px, measure 60–72ch, `text-wrap: pretty`. Headings `text-wrap: balance`.

---

## 4. Space & Layout

Density 2/10 (Spacious), from the skill. Base unit 8px.

| Token | Value |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 24px |
| `--space-lg` | 32px |
| `--space-xl` | 48px |
| `--space-2xl` | 64px |
| `--space-3xl` | 96px |
| `--space-section` | `clamp(6rem, 14vw, 13rem)` (vertical section rhythm) |
| `--gutter` | `clamp(1.25rem, 4vw, 4rem)` (page side padding) |

- **12-column grid** on ≥1024px, content offset asymmetrically (e.g. text cols 2–6, image cols 7–12).
- Breakpoints: 375 / 768 / 1024 / 1440 (skill checklist).
- Max content width 1600px; full-bleed imagery allowed.
- Corners: **0–2px radius**. Architecture is orthogonal. Pill shapes only for the navigation bar and its controls (client request) and the scroll indicator dot.
- No drop shadows (skill's shadow scale intentionally unused). Depth comes from photography and motion.

---

## 5. Motion

From the skill's GSAP presets + UX rules, adapted:

- **One pinned section per page maximum** (the 3D gallery). All other motion uses native scroll.
- Scrub-linked motion uses `scrub: 0.8–1.2`. No snapping, no scroll-jacking, no smooth-scroll library.
- Easing: entrances `expo.out` / `power3.out`; scrubbed tweens `none` / `power1.inOut`. **No `back`/`elastic`** (overshoot reads cheap here).
- Durations: micro 200–300ms, reveals 900–1400ms, page transition ≤ 700ms total.
- Rotations ≤ 24°. Z travel ≤ 900px at `perspective: 1400px`.
- `gsap.matchMedia()` gates everything:
  - `desktopMotion` = `(min-width: 1024px) and (prefers-reduced-motion: no-preference)` → full cinematic.
  - `mobileMotion` = `(max-width: 1023px) and (prefers-reduced-motion: no-preference)` → light reveals only (opacity + ≤24px translate). No pin, no 3D.
  - `reduce` → no animation. Content is rendered in its final state by CSS.
- **Content must be complete without JS.** Animated layouts (e.g. `.is-3d`) are opt-in classes added by JS.
- Scroll-linked text reveals animate **colour, never opacity**: start at `#8A8378` (3.36:1 on paper, passes for large text) and end at the element's own colour, so text is legible at every scroll position.
- Entrance (intro) animations are skipped on a prerendered first load (`introAllowed()`); the content is already on screen.
- All GSAP work lives inside `useGSAP({ scope })` so contexts revert and ScrollTriggers are killed on unmount.
- `ScrollTrigger.refresh()` after fonts load (skill framework note).

---

## 6. Components

**Navigation (desktop), client-specified pill form:** a fully rounded floating bar, the one place where
the orthogonal 0–2px corner rule is deliberately broken. Background `#1B1B1B` at 94% + blur (45% ink over the
home hero at the top), hairline `rgba(245,242,235,0.07)`, soft drop shadow. Three-column grid: wordmark left
(serif «DS» 1.45rem / tracking 0.14em + bronze-light uppercase «Architect» 0.66rem / tracking 0.34em, baseline-aligned; footer and favicon use a plain gable (roof) mark),
links centered (Manrope 0.9rem semibold, 65% paper → paper), CTA right as an ivory pill
(`--color-paper` fill, ink text, sentence case; hover → stone). Hover/focus indicator = a `paper/8%` pill that
slides between links and rests on the active one; the active item also gets a 4px dot below it.
Condenses (narrower, tighter padding) after 48px of scroll.

**Navigation (mobile):** 44×44 toggle (two lines → cross). Fullscreen ink overlay with staggered serif links.
`aria-expanded`, `aria-controls`, focus trap, Escape closes, focus returns to toggle, body scroll locked.
When closed the overlay is `visibility:hidden` + `inert`: it can **never** stay over content.

**Buttons:**
- Primary: bronze fill, ink text, 0 radius, 52px min height, uppercase eyebrow type. Hover: fill slides to paper.
- Ghost: hairline border, text color of the surface. Hover: hairline → bronze.
- Text link: underline drawn with `background-size` transition.

**Focus:** `outline: 2px solid currentColor; outline-offset: 4px` (on dark, bronze-light). Never removed.

**Imagery:** `<picture>` with AVIF + WebP + JPEG fallback at 640/1024/1600/2200w, explicit `width`/`height`
(no CLS), `loading="lazy"` below the fold, `fetchpriority="high"` for the hero only. Greek `alt` text that
describes space, light and material.

**Inner page intro (`PageIntro`):** eyebrow → display title (one italic accent word) → lead (≤ 2 sentences).
Top padding `clamp(9rem,18vw,14rem)` to clear the floating nav. Soft staggered rise on load only.

**Project card (`ProjectCard`):** whole card = one link. Photo in a fixed-ratio frame; hover scales the
image to 1.05 *inside* the frame (no layout shift) and fades in a bottom scrim with "Δείτε το έργο".
Title turns italic on hover. Ratios follow the asymmetric grid rhythm (4/3, 4/5, 4/5, 3/2).

**Category filters:** wrapping row of square toggle buttons (`aria-pressed`, count in tabular nums),
never a clipped single line (skill: *Chip Collection Reflow*). Sticky under the nav on ≥1024px only
(on phones it would cover a third of the screen). State lives in the URL (`?katigoria=`).
Result count announced via `aria-live`. Empty result = message + "Προβολή όλων" action.

**Lightbox:** native `<dialog>` + `showModal()` (focus containment, Escape). Arrow keys navigate,
counter is `aria-live`, focus returns to the opening thumbnail, page scroll locked while open.
No blur placeholder behind `object-contain` images.

**Forms (skill: Inline Validation, Focusable Error Summary, Form Labels, Required Indicators):**
- Visible labels above underline-style inputs; required marked with bronze `*`, optional with "(προαιρετικό)".
- Validate on blur; once touched, re-validate on change. Never validate untouched fields.
- On failed submit: error summary at the top (`role="alert"`, focused), each item links to and focuses its field;
  inline errors stay. `aria-invalid` + `aria-describedby` on every field.
- Choice groups = `fieldset/legend` with radio inputs styled as square toggles.
- Submit shows a busy state; results are stated honestly (no "sent" unless the backend confirms).
- Error color `--color-error` on paper; messages say what is wrong and how to fix it.

**Placeholder drawings:** schematic SVG plan (`PlanDrawing`) only while real drawings are missing,
always labeled "Ενδεικτικό σχέδιο".

**Placeholder content** is always visibly labeled `Ενδεικτικό` / `Προσωρινό περιεχόμενο`.

---

## 7. Anti-patterns (do NOT use)

From the skill plus the brief:
- Generic SaaS hero / feature cards / colorful gradients / AI purple-pink.
- Emoji icons (inline SVG only, `aria-hidden` when decorative).
- More than one pinned section; scroll hijacking; snapping.
- Abrupt zooms, rotations > 24°, continuous full-screen animations.
- Bronze text on paper (2.9:1).
- Layout-shifting hovers (scale only inside `overflow:hidden` frames).
- Fake awards, clients, studies or completed projects.

---

## 8. Pre-delivery checklist

- [ ] Contrast pairs from §2 only
- [ ] Visible focus on every interactive element; skip link works
- [ ] `prefers-reduced-motion` → final states, no pin
- [ ] Mobile (<1024px) → no pin/3D, light reveals
- [ ] 375 / 768 / 1024 / 1440 checked, no horizontal scroll
- [ ] Images have width/height, lazy below fold, Greek alt
- [ ] All text, titles, meta in Greek
- [ ] No overlay remains after navigation (menu + page transition)
- [ ] `npm run build` passes
