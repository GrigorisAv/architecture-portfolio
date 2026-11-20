import type { ProjectType, QuoteRequest } from '../content/types'

export type QuoteField = keyof QuoteRequest
export type QuoteErrors = Partial<Record<QuoteField, string>>

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: 'nea-katoikia', label: 'Νέα κατοικία' },
  { value: 'anakainisi', label: 'Ανακαίνιση' },
  { value: 'interior', label: 'Interior design' },
  { value: 'epaggelmatikos', label: 'Επαγγελματικός χώρος' },
  { value: 'allo', label: 'Άλλο' },
]

export const DESCRIPTION_MIN = 20
export const DESCRIPTION_MAX = 2000

export const emptyQuote: QuoteRequest = {
  fullName: '',
  email: '',
  phone: '',
  projectType: '',
  area: '',
  sizeSqm: '',
  description: '',
  privacyConsent: false,
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Pure, framework-free validation (reusable server-side in Phase 3). Messages in Greek. */
export function validateField(field: QuoteField, v: QuoteRequest): string | undefined {
  switch (field) {
    case 'fullName': {
      const s = v.fullName.trim()
      if (!s) return 'Συμπληρώστε το ονοματεπώνυμό σας.'
      if (s.length < 3) return 'Το ονοματεπώνυμο πρέπει να έχει τουλάχιστον 3 χαρακτήρες.'
      return
    }
    case 'email': {
      const s = v.email.trim()
      if (!s) return 'Συμπληρώστε το email σας.'
      if (!EMAIL.test(s)) return 'Το email δεν φαίνεται σωστό. Παράδειγμα: onoma@example.gr'
      return
    }
    case 'phone': {
      const s = v.phone.trim()
      if (!s) return 'Συμπληρώστε ένα τηλέφωνο επικοινωνίας.'
      const digits = s.replace(/[\s\-().]/g, '').replace(/^\+/, '')
      if (!/^\d+$/.test(digits) || digits.length < 10 || digits.length > 15) return 'Συμπληρώστε έναν έγκυρο αριθμό τηλεφώνου, π.χ. 69XXXXXXXX ή +30 21XXXXXXXX.'
      return
    }
    case 'projectType':
      return v.projectType ? undefined : 'Επιλέξτε το είδος του έργου.'
    case 'area':
      return v.area.trim() ? undefined : 'Συμπληρώστε την περιοχή του έργου.'
    case 'sizeSqm': {
      const s = v.sizeSqm.trim().replace(',', '.')
      if (!s) return
      const n = Number(s)
      if (!Number.isFinite(n) || n <= 0 || n > 100000) return 'Τα τετραγωνικά μέτρα πρέπει να είναι θετικός αριθμός, π.χ. 120.'
      return
    }
    case 'description': {
      const s = v.description.trim()
      if (!s) return 'Περιγράψτε σύντομα το έργο σας.'
      if (s.length < DESCRIPTION_MIN) return `Η περιγραφή πρέπει να έχει τουλάχιστον ${DESCRIPTION_MIN} χαρακτήρες.`
      if (s.length > DESCRIPTION_MAX) return `Η περιγραφή μπορεί να έχει έως ${DESCRIPTION_MAX} χαρακτήρες.`
      return
    }
    case 'privacyConsent':
      return v.privacyConsent ? undefined : 'Για να συνεχίσετε, αποδεχτείτε την Πολιτική Απορρήτου.'
  }
}

export const FIELD_ORDER: QuoteField[] = ['fullName', 'email', 'phone', 'projectType', 'area', 'sizeSqm', 'description', 'privacyConsent']

export function validateAll(v: QuoteRequest): QuoteErrors {
  const errors: QuoteErrors = {}
  for (const f of FIELD_ORDER) {
    const e = validateField(f, v)
    if (e) errors[f] = e
  }
  return errors
}
