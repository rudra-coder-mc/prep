import { createReadStream } from 'node:fs'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { headingSlug } from '@prep/core/headings'
import { buildArchive, type ArchiveContent } from '@prep/content/archive'

/**
 * The archive is what the phone reads, and a lesson page in it is the one part
 * that is compiled rather than copied. Everything else in the archive is data
 * the unit tests can check; a page that mounts nothing, or mounts and then
 * throws, only shows up in a browser.
 *
 * These specs open the pages as a device does: from a static directory, with no
 * server and no application behind them.
 */

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
}

/** Serves the built archive, which is all a lesson page needs to open. */
function serve(directory: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((request, response) => {
    const requested = path.join(directory, decodeURIComponent((request.url ?? '/').split('?')[0]!))
    // The archive is ours and the paths come from its own manifest, but a
    // traversal out of it would silently serve the repository.
    if (!requested.startsWith(directory)) {
      response.writeHead(403).end()
      return
    }

    stat(requested)
      .then((entry) => {
        if (!entry.isFile()) throw new Error('not a file')
        response.writeHead(200, { 'content-type': TYPES[path.extname(requested)] ?? 'text/plain' })
        createReadStream(requested).pipe(response)
      })
      .catch(() => response.writeHead(404).end())
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({
        origin: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(() => done())),
      })
    })
  })
}

let origin = ''
let close: () => Promise<void> = async () => {}
let content: ArchiveContent
let directory = ''

test.beforeAll(async () => {
  // Built somewhere of its own rather than over the one in the repository, the
  // same way this suite takes its own database and its own speech cache. A test
  // run should not decide what is in a developer's archive.
  directory = await mkdtemp(path.join(tmpdir(), 'prep-archive-e2e-'))
  const built = await buildArchive(directory)
  content = built.content
  const served = await serve(built.directory)
  origin = served.origin
  close = served.close

  // The manifest has to describe what was actually written, because a device
  // downloads by that list and never looks in the directory itself.
  for (const file of built.manifest.files) {
    await expect(readFile(path.join(built.directory, file))).resolves.toBeDefined()
  }
})

test.afterAll(async () => {
  await close()
  await rm(directory, { recursive: true, force: true })
})

test('every lesson page opens, mounts and reports no errors', async ({ page }) => {
  const problems: string[] = []
  page.on('pageerror', (error) => problems.push(`${page.url()}: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`${page.url()}: ${message.text()}`)
  })

  for (const topic of content.topics) {
    await page.goto(`${origin}/${topic.lesson}`)

    // Every lesson opens with a heading, and every narration section points at
    // one, so an empty root means the page mounted nothing.
    await expect(page.locator('#lesson h2').first()).toBeVisible()

    // The headings the narration anchors to have to survive compilation, or the
    // lesson stops following the voice on the phone and nothing says why.
    const ids = await page
      .locator('#lesson h2[id]')
      .evaluateAll((all) => all.map((heading) => heading.id))
    for (const section of topic.narration ?? []) {
      expect(ids, `${topic.slug} is missing the heading ${section.heading} points at`).toContain(
        headingSlug(section.heading),
      )
    }
  }

  expect(problems).toEqual([])
})

test('a lesson page animates and its visuals can be stepped', async ({ page }) => {
  await page.goto(`${origin}/lessons/javascript/closures.html`)

  const walkthrough = page.getByRole('figure', { name: 'Two counters, two scopes' })
  await expect(walkthrough).toBeVisible()
  await expect(walkthrough.getByText('1/5')).toBeVisible()

  await walkthrough.getByLabel('Next step').click()
  await expect(walkthrough.getByText('2/5')).toBeVisible()

  await walkthrough.getByLabel('Previous step').click()
  await expect(walkthrough.getByText('1/5')).toBeVisible()

  // The recap map every lesson closes with, which is the visual that renders
  // whole rather than a step at a time.
  const map = page.getByRole('figure', { name: 'The whole topic' })
  await expect(map.getByText('What it captures')).toBeVisible()
})

test('a lesson page plays a visual by itself once it is scrolled to', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`${origin}/lessons/javascript/closures.html`)

  const walkthrough = page.getByRole('figure', { name: 'Two counters, two scopes' })
  await walkthrough.scrollIntoViewIfNeeded()
  await expect(walkthrough.getByText('2/5')).toBeVisible({ timeout: 15_000 })
})

test('the pages carry their own styling, so nothing is left to the app around them', async ({
  page,
}) => {
  await page.goto(`${origin}/lessons/javascript/closures.html`)

  // The theme comes from the stylesheet the archive builds. Without it the page
  // renders as unstyled markup, which still passes every assertion above.
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(background).not.toBe('rgba(0, 0, 0, 0)')

  const width = await page.locator('#lesson').evaluate((el) => el.clientWidth)
  expect(width).toBeLessThan(await page.evaluate(() => window.innerWidth))
})
