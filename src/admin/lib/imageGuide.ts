/**
 * Recommended photo sizes per slot, derived from the site's actual frames (aspect-ratio in the components).
 * Shown next to every upload in the CMS; `checkFit` warns (never blocks) on small or wrongly oriented files.
 */
export type Orientation = 'landscape' | 'portrait' | 'any'

export interface ImageSpec {
  /** Short Greek label of the frame, e.g. «Οριζόντια 3:2». */
  frame: string
  /** Ideal size with units, e.g. «3000×2000 px». */
  ideal: string
  orientation: Orientation
  /** Below this width the photo looks soft on large screens. */
  minWidth: number
  note?: string
}

const L = 'landscape' as const
const P = 'portrait' as const

export const IMAGE_SPECS = {
  hero: {
    frame: 'Οριζόντια 3:2 ή 16:9',
    ideal: '3000×2000 px',
    orientation: L,
    minWidth: 2400,
    note: 'Γεμίζει όλη την οθόνη. Στο κινητό κόβεται σε κάθετο κάδρο και φαίνεται περίπου το μεσαίο τρίτο: το κτίριο στο κέντρο, με «αέρα» γύρω του. Ο τίτλος πατάει στο κάτω μέρος.',
  },
  philosophy: { frame: 'Κάθετη 4:5', ideal: '1600×2000 px', orientation: P, minWidth: 1400 },
  architecture: { frame: 'Οριζόντια 4:3', ideal: '2400×1800 px', orientation: L, minWidth: 1800, note: 'Ιδανικά εξωτερικό κτιρίου.' },
  interiors: { frame: 'Οριζόντια 3:2', ideal: '2400×1600 px', orientation: L, minWidth: 1800, note: 'Ιδανικά εσωτερικός χώρος.' },
  material1: { frame: 'Οριζόντια 5:4', ideal: '2000×1600 px', orientation: L, minWidth: 1600 },
  material2: { frame: 'Κάθετη 3:4', ideal: '1500×2000 px', orientation: P, minWidth: 1200 },
  material3: { frame: 'Οριζόντια 4:3', ideal: '2000×1500 px', orientation: L, minWidth: 1600 },
  portrait: { frame: 'Κάθετη 4:5', ideal: '1600×2000 px', orientation: P, minWidth: 1200, note: 'Το πρόσωπο στο πάνω-μεσαίο τμήμα, ουδέτερο φόντο. Εμφανίζεται και στην αρχική.' },
  aboutApproach: { frame: 'Κάθετη 4:5', ideal: '1600×2000 px', orientation: P, minWidth: 1200 },
  service: { frame: 'Οριζόντια 4:3', ideal: '2000×1500 px', orientation: L, minWidth: 1600 },
  projectCover: {
    frame: 'Οριζόντια 3:2',
    ideal: '2400×1600 px ή μεγαλύτερη',
    orientation: L,
    minWidth: 2000,
    note: 'Εμφανίζεται σε πολλά κάδρα: 3D gallery αρχικής, λίστα έργων (4:3 / 4:5 / 3:2), ολοσέλιδη στο έργο (κάθετη στο κινητό), λωρίδα 21:9. Θέμα στο κέντρο, τίποτα σημαντικό στις άκρες.',
  },
  galleryWide: { frame: 'Πανοραμική 16:9 (όλο το πλάτος)', ideal: '2400×1350 px', orientation: L, minWidth: 2000 },
  galleryLandscape: { frame: 'Οριζόντια 4:3', ideal: '2000×1500 px', orientation: L, minWidth: 1600 },
  galleryPortrait: { frame: 'Κάθετη 4:5', ideal: '1600×2000 px', orientation: P, minWidth: 1200 },
  drawing: {
    frame: 'Οποιαδήποτε αναλογία (εμφανίζεται ολόκληρο, χωρίς κόψιμο)',
    ideal: '2400 px πλάτος',
    orientation: 'any' as const,
    minWidth: 1600,
    note: 'Λευκό φόντο, καθαρές γραμμές. PNG ή JPG υψηλής ποιότητας, όχι φωτογραφία από κινητό.',
  },
} satisfies Record<string, ImageSpec>

/** Project photos cycle through three frames on the project page (see GALLERY_LAYOUT in ProjectDetailPage). */
const GALLERY_CYCLE = [IMAGE_SPECS.galleryWide, IMAGE_SPECS.galleryLandscape, IMAGE_SPECS.galleryPortrait]
export const gallerySpec = (photoIndex: number): ImageSpec => GALLERY_CYCLE[photoIndex % GALLERY_CYCLE.length]

export const GENERAL_RULES = 'JPG (προτείνεται), PNG, WebP ή AVIF, έως 30 MB. Μετατρέπονται αυτόματα σε WebP 800/1600/2400 px: πάνω από 2400 px πλάτος δεν προσθέτει ποιότητα.'

/** Original pixel size of a file, before any resizing. */
export async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bmp = await createImageBitmap(file)
    const size = { width: bmp.width, height: bmp.height }
    bmp.close()
    return size
  } catch {
    return null
  }
}

/** Orientation-only check (sizes stored after resizing are capped, so width is not reliable here). */
export function orientationWarning(spec: ImageSpec, width: number, height: number): string | null {
  if (spec.orientation === 'landscape' && height > width * 1.05) return 'Η θέση θέλει οριζόντια φωτογραφία· αυτή είναι κάθετη και θα κοπεί πολύ.'
  if (spec.orientation === 'portrait' && width > height * 1.05) return 'Η θέση θέλει κάθετη φωτογραφία· αυτή είναι οριζόντια και θα κοπεί πολύ.'
  return null
}

export function checkFit(spec: ImageSpec, width: number, height: number): string[] {
  const out: string[] = []
  if (width < spec.minWidth) out.push(`Έχει μόνο ${width} px πλάτος· προτείνεται τουλάχιστον ${spec.minWidth} px (ιδανικά ${spec.ideal}). Μπορεί να φαίνεται θολή σε μεγάλες οθόνες.`)
  const o = orientationWarning(spec, width, height)
  if (o) out.push(o)
  return out
}
