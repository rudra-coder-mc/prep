/**
 * The one place a byte count becomes something to read.
 *
 * A track's audio is measured in hundreds of megabytes and a single recording in
 * tens of kilobytes, and the same line has to carry both, so the unit follows
 * the number rather than being fixed.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.round(bytes)} B`

  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} kB`

  const mb = kb / 1024
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`

  return `${(mb / 1024).toFixed(1)} GB`
}
