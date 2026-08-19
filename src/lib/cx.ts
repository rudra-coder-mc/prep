type ClassValue = string | false | null | undefined

/** Joins class names and drops the falsy ones. Small on purpose: no merge, no dependency. */
export function cx(...values: ClassValue[]): string {
  return values.filter((value): value is string => Boolean(value)).join(' ')
}
