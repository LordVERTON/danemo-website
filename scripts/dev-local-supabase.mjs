/**
 * Cible : développement local uniquement.
 *
 * Pré-requis : `npx supabase start` doit être actif.
 * Effet : démarre Next.js avec les identifiants de l'instance Supabase locale,
 * sans écrire de secrets dans un fichier .env.
 */
import { execFileSync, spawn } from 'node:child_process'

function readLocalSupabaseEnvironment() {
  const isWindows = process.platform === 'win32'
  const output = isWindows
    ? execFileSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', 'npx.cmd supabase status -o env'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
      })
    : execFileSync('npx', ['supabase', 'status', '-o', 'env'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
      })

  return Object.fromEntries(
    output
      .split(/\r?\n/)
      .map((line) => {
        const separator = line.indexOf('=')
        if (separator === -1) return null

        const key = line.slice(0, separator)
        const value = line.slice(separator + 1).replace(/^['"]|['"]$/g, '')
        return [key, value]
      })
      .filter((entry) => entry !== null),
  )
}

try {
  const localEnvironment = readLocalSupabaseEnvironment()
  const apiUrl = localEnvironment.API_URL
  const publishableKey = localEnvironment.PUBLISHABLE_KEY || localEnvironment.ANON_KEY
  const serviceRoleKey = localEnvironment.SERVICE_ROLE_KEY || localEnvironment.SECRET_KEY

  if (!apiUrl || !publishableKey || !serviceRoleKey) {
    throw new Error('Supabase local did not provide the required API credentials.')
  }

  if (process.argv.includes('--check')) {
    console.log('Local Supabase environment is ready.')
    process.exit(0)
  }

  const child = spawn(
    'next',
    ['dev', '--experimental-https'],
    {
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: apiUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey,
        SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
      },
      shell: process.platform === 'win32',
      stdio: 'inherit',
    },
  )

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal)
    process.exit(code ?? 1)
  })
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unable to read the local Supabase environment.'
  console.error(`Unable to start local development: ${message}`)
  console.error('Start Supabase locally with: npx supabase start')
  process.exit(1)
}
