/**
 * Seeds the single user from the environment. Idempotent: run on every container
 * start. The real implementation arrives with authentication in task 4.
 */
const DEFAULTS = { email: 'dev@local', password: 'dev' }

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? DEFAULTS.email
  const password = process.env.SEED_USER_PASSWORD ?? DEFAULTS.password

  if (email === DEFAULTS.email || password === DEFAULTS.password) {
    console.warn(
      'WARNING: seeded user is still using default credentials. Set SEED_USER_EMAIL and SEED_USER_PASSWORD before exposing this beyond localhost.',
    )
  }

  console.log(`seed user ready: ${email}`)
}

main().catch((error) => {
  console.error('seed failed:', error)
  process.exit(1)
})
