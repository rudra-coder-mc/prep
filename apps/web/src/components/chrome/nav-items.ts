export type NavItem = { href: '/' | '/topics' | '/review'; label: string }

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/topics', label: 'Topics' },
  { href: '/review', label: 'Review' },
]

/**
 * The dashboard is only active on an exact match; everything else owns its
 * whole subtree, so a lesson still highlights Topics.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
