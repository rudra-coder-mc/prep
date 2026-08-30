import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { compile } from '@mdx-js/mdx'
import * as esbuild from 'esbuild'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'
import { topicFile } from '../loader'
import { lessonPagePath } from './data'
import {
  GLOBAL_CSS,
  MDX_COMPONENTS,
  VISUALS_DIR,
  WEB_SOURCE_ROOT,
  WORKSPACE_ROOT,
} from './web-sources'

/**
 * Compiling every lesson into a page that opens on its own.
 *
 * A lesson is MDX importing a library of animated components built on the DOM
 * and on `motion`, and none of that runs in React Native. So each one is
 * compiled ahead of time into a self-contained page and shown in a WebView,
 * rather than the visuals being ported and then maintained twice. See
 * docs/decisions/0034-lessons-are-pre-rendered-and-shown-in-a-webview.md.
 *
 * The pages share one chunk, because React, `motion` and the visual library are
 * the same bytes for every lesson and a device downloads the archive whole.
 */

export type LessonTopic = { technology: string; directory: string; title: string }

export type BuiltLessons = {
  /** Every file written, relative to the archive root, for the manifest. */
  files: string[]
  bytes: number
}

/** Where the shared chunk and the stylesheet go, relative to the archive root. */
const ASSETS = 'lessons/assets'

/**
 * The page around the lesson. Deliberately bare: the phone draws the player, the
 * heading and the navigation natively around this WebView, so anything drawn
 * here would be a second, worse version of them.
 */
function pageHtml(title: string, script: string, stylesheet: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${stylesheet}">
</head>
<body>
<main id="lesson" class="lesson-page"></main>
<script type="module" src="${script}"></script>
</body>
</html>
`
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (character) => ESCAPES[character] ?? character)
}

/**
 * The page's own layout, as plain CSS rather than utility classes.
 *
 * The shell is ours rather than the lesson's, so writing it here keeps it out of
 * what Tailwind has to scan, and keeps the scan pointed at the one thing that
 * decides a lesson's classes: the component map and the visuals.
 */
const PAGE_CSS = `
.lesson-page {
  margin: 0 auto;
  max-width: 44rem;
  padding: 1.5rem 1.25rem 4rem;
}
.lesson-page > :first-child {
  margin-top: 0;
}
`

/**
 * The stylesheet every page links.
 *
 * `source(none)` turns off Tailwind's own file discovery, which would otherwise
 * walk the whole repository from wherever this ran. What a lesson can look like
 * is decided by the component map and the visual components, so those are named
 * instead and nothing else can quietly widen the sheet.
 */
async function buildStylesheet(): Promise<string> {
  const global = await readFile(GLOBAL_CSS, 'utf8')
  const theme = global.replace(/^[^\S\n]*@import\s+['"]tailwindcss['"];[^\S\n]*$/m, '')

  // Without this the sheet imports Tailwind twice, and the second import has no
  // `source(none)` on it, so it discovers every file in the repository and the
  // stylesheet quietly becomes enormous.
  if (theme === global) {
    throw new Error(
      `${GLOBAL_CSS} no longer imports tailwindcss on a line of its own, which the archive stylesheet depends on`,
    )
  }

  const entry = [
    `@import 'tailwindcss' source(none);`,
    `@source '${VISUALS_DIR}';`,
    `@source '${MDX_COMPONENTS}';`,
    theme,
    PAGE_CSS,
  ].join('\n')

  // Processed from the web app's own CSS location so that `@import 'tailwindcss'`
  // and the theme resolve exactly as they do in the app's build.
  const result = await postcss([tailwind()]).process(entry, { from: GLOBAL_CSS })
  return result.css
}

/** MDX compiled to a module, and the entry that mounts it. */
async function writeEntries(topics: LessonTopic[], work: string): Promise<string[]> {
  const runtime = path.join(WORKSPACE_ROOT, 'packages/content/src/archive/lesson-runtime.tsx')

  return Promise.all(
    topics.map(async (topic) => {
      const source = await readFile(
        topicFile(topic.technology, topic.directory, 'lesson.mdx'),
        'utf8',
      )
      const compiled = await compile(source, {
        jsx: false,
        development: false,
        providerImportSource: '@mdx-js/react',
      })

      const name = `${topic.technology}__${topic.directory}`
      await writeFile(path.join(work, `${name}.lesson.jsx`), String(compiled))

      const entry = path.join(work, `${name}.jsx`)
      await writeFile(
        entry,
        [
          `import { mountLesson } from ${JSON.stringify(runtime)}`,
          `import Lesson from './${name}.lesson.jsx'`,
          `mountLesson(Lesson)`,
          '',
        ].join('\n'),
      )
      return entry
    }),
  )
}

/**
 * Builds one page per topic into `outDir`, plus the chunk and stylesheet they
 * share. Returns what was written so the manifest can list it.
 */
export async function buildLessons(topics: LessonTopic[], outDir: string): Promise<BuiltLessons> {
  // Resolved, because the temporary directory is reached through a symlink on
  // macOS and esbuild reports its entry points canonically. Comparing the two
  // forms never matches, and every page then fails to find its own bundle.
  const work = await realpath(await mkdtemp(path.join(tmpdir(), 'prep-lessons-')))

  try {
    const entries = await writeEntries(topics, work)
    const assetsDir = path.join(outDir, ASSETS)
    await mkdir(assetsDir, { recursive: true })

    // Hashed names, so a device that has cached a page's JavaScript cannot serve
    // it against a newer archive. A stale chunk on a phone is a blank lesson,
    // and it is a long way from here to noticing that.
    const bundle = await esbuild.build({
      entryPoints: entries,
      bundle: true,
      splitting: true,
      format: 'esm',
      outdir: assetsDir,
      entryNames: '[name]-[hash]',
      chunkNames: 'shared-[hash]',
      jsx: 'automatic',
      minify: true,
      metafile: true,
      target: ['es2022'],
      alias: { '@': WEB_SOURCE_ROOT },
      // The compiled lessons are written to a temporary directory, which has no
      // node_modules above it, so esbuild is told where the workspace's are.
      nodePaths: [path.join(WORKSPACE_ROOT, 'node_modules')],
      define: { 'process.env.NODE_ENV': '"production"' },
      logLevel: 'silent',
    })

    const css = await buildStylesheet()
    await writeFile(path.join(assetsDir, 'lesson.css'), css)

    const built = Object.entries(bundle.metafile.outputs)
    const files = [`${ASSETS}/lesson.css`]
    let bytes = Buffer.byteLength(css)

    for (const [file, output] of built) {
      files.push(path.relative(outDir, path.resolve(file)))
      bytes += output.bytes
    }

    // Paired on the entry point esbuild reports rather than on the output's name.
    // Output names are hashed, and one topic's name can prefix another's, so
    // matching by name would let `javascript__array` claim the bundle built for
    // `javascript__array-methods` and serve one topic's lesson under the other's.
    const bundleFor = new Map(
      built.flatMap(([file, output]) =>
        output.entryPoint === undefined ? [] : [[path.resolve(output.entryPoint), file] as const],
      ),
    )

    for (const [index, topic] of topics.entries()) {
      const script = bundleFor.get(path.resolve(entries[index]!))
      if (script === undefined)
        throw new Error(`no bundle was produced for ${topic.technology}/${topic.directory}`)

      const page = lessonPagePath(topic.technology, topic.directory)
      const to = (asset: string) => path.relative(path.dirname(page), asset)
      const html = pageHtml(
        topic.title,
        to(path.relative(outDir, path.resolve(script))),
        to(`${ASSETS}/lesson.css`),
      )

      await mkdir(path.join(outDir, path.dirname(page)), { recursive: true })
      await writeFile(path.join(outDir, page), html)
      files.push(page)
      bytes += Buffer.byteLength(html)
    }

    return { files: files.sort(), bytes }
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}
