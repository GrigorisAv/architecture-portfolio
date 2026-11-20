export interface NavItem {
  label: string
  /** Route path, optionally with a hash for an in-page section on the homepage. */
  to: string
  /** Homepage section that marks this item active while in view. */
  section?: string
}

export const primaryNav: NavItem[] = [
  { label: 'Έργα', to: '/erga', section: 'erga' },
  { label: 'Υπηρεσίες', to: '/ypiresies', section: 'ypiresies' },
  { label: 'Σχετικά', to: '/sxetika', section: 'architektonas' },
]

export const ctaNav: NavItem = { label: 'Αίτημα Προσφοράς', to: '/aitima-prosforas', section: 'epikoinonia' }

export const homeSections = ['arxi', 'filosofia', 'erga', 'ypiresies', 'architektonas', 'epikoinonia'] as const
