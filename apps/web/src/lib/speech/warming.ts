import { narrate } from './narrate'

/**
 * Making recordings ahead of the listener, one at a time.
 *
 * Warming is speculative work, and speculative work must never be in the way of
 * a reader. Piper saturates the machine while it runs, so several warms at once
 * do not just take longer each: they starve the application serving the page
 * that asked for them. Answering a handful of questions quickly was enough to
 * make the platform stop responding.
 *
 * So one recording is made at a time, and only the newest request waits for a
 * turn. A reader who moves through five questions has left four behind, and the
 * recording worth making is the one for the question they are on. The ones it
 * replaces are told so rather than left hanging.
 *
 * A listener pressing play is not affected by any of this: that path is
 * `narrate` directly, which joins the work in flight if this started it.
 */
export type Warmed = 'recorded' | 'superseded'

type Job = {
  script: string
  resolve: (outcome: Warmed) => void
  reject: (error: unknown) => void
}

let running = false
let queued: Job | null = null

function next(): void {
  const job = queued
  queued = null

  if (!job) {
    running = false
    return
  }

  narrate(job.script).then(
    () => {
      job.resolve('recorded')
      next()
    },
    (error: unknown) => {
      job.reject(error)
      next()
    },
  )
}

/** Records a script when it is this one's turn, or reports being replaced. */
export function warmRecording(script: string): Promise<Warmed> {
  return new Promise<Warmed>((resolve, reject) => {
    queued?.resolve('superseded')
    queued = { script, resolve, reject }

    if (!running) {
      running = true
      next()
    }
  })
}
