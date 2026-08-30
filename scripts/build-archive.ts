import { archiveDirectory, buildArchive } from '@prep/content/archive'

/**
 * Builds the content archive: everything a device needs to run the loop with
 * nothing to connect to.
 *
 * `npm run content:archive`, or with a directory to write somewhere else.
 *
 * It needs neither the web app nor a database running, because what it reads is
 * files. That is the point of building it here rather than out of the Next
 * build: making what the phone reads is a content operation, not a deployment.
 * See docs/decisions/0034-lessons-are-pre-rendered-and-shown-in-a-webview.md.
 *
 * The version it prints is a hash of the files it was built from, so a device
 * comparing versions cannot be told an archive is current when it is not.
 */
async function main() {
  const directory = process.argv[2] ?? archiveDirectory()
  const started = Date.now()

  const { manifest, lessonBytes } = await buildArchive(directory)
  const seconds = ((Date.now() - started) / 1000).toFixed(1)

  console.log(`archive ${manifest.version} in ${directory}`)
  console.log(
    `${manifest.topics} topics, ${manifest.questions} questions, ${manifest.exercises} exercises, ${manifest.narrationSections} narration sections`,
  )
  console.log(
    `${manifest.topics} lesson pages, ${(lessonBytes / 1024 / 1024).toFixed(1)} MB of pages and assets, built in ${seconds}s`,
  )
  console.log(
    `${manifest.archive.file} is ${(manifest.archive.bytes / 1024 / 1024).toFixed(1)} MB, which is what a device downloads`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
