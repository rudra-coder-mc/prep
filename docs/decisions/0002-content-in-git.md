# 2. Curriculum content lives in git, not in the database

**Status:** accepted — 2026-08-19

## Context

Topics, lessons, questions and exercises have to live somewhere. The original
handoff sketched `Technology`, `Topic` and `Question` tables, implying content
would be seeded into the database.

The requirement that each topic carry an inline animation is what forced this
decision. An animated lesson is not text — it is MDX importing React components
with structured props.

## Decision

Content is files under `content/<technology>/<topic>/`, compiled into the
application at build time. The database stores only users and their progress.
The two are joined by string slugs, not foreign keys.

## Alternatives

**Everything in the database.** Rejected. Storing MDX in a text column means
either no inline animations, or an escape hatch that reintroduces code in the
database. Content changes also stop being reviewable in diffs, which matters when
the curriculum is the main thing that will change over the project's life.

**Hybrid — lessons in files, questions in the database.** Rejected. It buys the
ability to add a question from the UI mid-session, at the cost of two sources of
truth, a seeding path, and questions that cannot be reviewed alongside the lesson
they belong to.

## Consequences

Adding a topic is adding a directory — no migration, no seed script, no registry
edit. The curriculum is diffable and can be edited in VS Code alongside
everything else.

Content cannot be edited from the web interface, and adding a question means a
rebuild. Both are acceptable: the author and the user are the same person, and
the dev compose profile bind-mounts `content/` so authoring is hot-reloaded.

Deleting content orphans progress rows. Orphans are harmless — a topic that no
longer exists simply never appears in a queue — and a maintenance task can
reconcile them.
