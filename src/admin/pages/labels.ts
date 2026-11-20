import type { QuoteStatus } from '../../content/records'
import { PROJECT_TYPES } from '../../lib/quoteValidation'

export const PROJECT_TYPE_LABEL = Object.fromEntries(PROJECT_TYPES.map((t) => [t.value, t.label])) as Record<string, string>

export const QUOTE_STATUS: Record<QuoteStatus, { label: string; tone: 'bronze' | 'gray' | 'green' | 'red' }> = {
  new: { label: 'Νέο', tone: 'bronze' },
  read: { label: 'Διαβασμένο', tone: 'gray' },
  replied: { label: 'Απαντήθηκε', tone: 'green' },
  archived: { label: 'Αρχειοθετημένο', tone: 'gray' },
}
