/**
 * Cible : Supabase local uniquement (`npx supabase start`).
 *
 * Exécute les principaux parcours métier via les Route Handlers Next.js :
 * authentification admin, clients, commandes, conteneurs, tracking et QR.
 * Les données API-TEST créées sont supprimées en fin de scénario ou par le
 * nettoyage de secours local si une assertion échoue.
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const REQUEST_TIMEOUT_MS = 20_000
const STARTUP_TIMEOUT_MS = 90_000
const TEST_HOST = '127.0.0.1'
const TEST_PORT = Number.parseInt(process.env.TEST_API_PORT || '3210', 10)

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

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

function ensureLocalTarget(apiUrl) {
  const url = new URL(apiUrl)
  assert(
    url.protocol === 'http:' && (url.hostname === '127.0.0.1' || url.hostname === 'localhost'),
    'API tests refused to run because the Supabase target is not local.',
  )
}

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
    this.cookies = new Map()
  }

  storeCookies(headers) {
    const setCookies = typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : [headers.get('set-cookie')].filter(Boolean)

    for (const setCookie of setCookies) {
      const [pair] = setCookie.split(';')
      const separator = pair.indexOf('=')
      if (separator === -1) continue
      this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1))
    }
  }

  async request(path, { method = 'GET', json, form } = {}) {
    const headers = { Accept: 'application/json' }
    if (this.cookies.size > 0) {
      headers.Cookie = [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ')
    }

    let body
    if (json !== undefined) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(json)
    } else if (form !== undefined) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
      body = new URLSearchParams(form).toString()
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    this.storeCookies(response.headers)

    const text = await response.text()
    let payload = null
    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        payload = text
      }
    }

    return { response, payload }
  }
}

function expectStatus(result, expected, label) {
  const statuses = Array.isArray(expected) ? expected : [expected]
  const providerMessage = result.payload && typeof result.payload === 'object'
    ? result.payload.error
    : null
  assert(
    statuses.includes(result.response.status),
    `${label}: HTTP ${result.response.status}${providerMessage ? ` (${providerMessage})` : ''}`,
  )
  return result.payload
}

async function waitForServer(api, serverProcess, getServerLogs) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Next.js stopped during startup.\n${getServerLogs()}`)
    }

    try {
      const result = await api.request('/api/auth/session')
      if (result.response.status === 200) return
    } catch {
      // Next.js is not ready yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`Next.js did not become ready within ${STARTUP_TIMEOUT_MS / 1000}s.\n${getServerLogs()}`)
}

async function buildApplication(nextCliPath, cwd, environment) {
  let buildLogs = ''
  const appendBuildLogs = (chunk) => {
    buildLogs = `${buildLogs}${chunk}`.slice(-12_000)
  }
  const buildProcess = spawn(process.execPath, [nextCliPath, 'build'], {
    cwd,
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  buildProcess.stdout.on('data', appendBuildLogs)
  buildProcess.stderr.on('data', appendBuildLogs)

  const exitCode = await new Promise((resolve, reject) => {
    buildProcess.once('error', reject)
    buildProcess.once('exit', resolve)
  })
  if (exitCode !== 0) {
    throw new Error(`Next.js build failed before the API tests.\n${buildLogs.trim()}`)
  }
}

async function stopServer(serverProcess) {
  if (!serverProcess || serverProcess.exitCode !== null) return

  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/pid', String(serverProcess.pid), '/t', '/f'], { stdio: 'ignore' })
    return
  }

  serverProcess.kill('SIGTERM')
  await Promise.race([
    new Promise((resolve) => serverProcess.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ])
  if (serverProcess.exitCode === null) serverProcess.kill('SIGKILL')
}

async function main() {
  assert(Number.isInteger(TEST_PORT) && TEST_PORT > 0 && TEST_PORT <= 65_535, 'TEST_API_PORT must be a valid port.')

  const localEnvironment = readLocalSupabaseEnvironment()
  const apiUrl = localEnvironment.API_URL
  const publishableKey = localEnvironment.PUBLISHABLE_KEY || localEnvironment.ANON_KEY
  const serviceRoleKey = localEnvironment.SERVICE_ROLE_KEY || localEnvironment.SECRET_KEY
  assert(apiUrl && publishableKey && serviceRoleKey, 'Supabase local did not provide the required API credentials.')
  ensureLocalTarget(apiUrl)

  const baseUrl = `http://${TEST_HOST}:${TEST_PORT}`
  const nextCliPath = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url))
  const projectDirectory = fileURLToPath(new URL('..', import.meta.url))
  const applicationEnvironment = {
    ...process.env,
    NEXTAUTH_URL: baseUrl,
    NEXT_PUBLIC_SUPABASE_URL: apiUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  }

  console.log('Préparation du build Next.js avec Supabase local…')
  await buildApplication(nextCliPath, projectDirectory, applicationEnvironment)

  let serverLogs = ''
  const appendServerLogs = (chunk) => {
    serverLogs = `${serverLogs}${chunk}`.slice(-8_000)
  }

  const serverProcess = spawn(
    process.execPath,
    [nextCliPath, 'start', '--hostname', TEST_HOST, '--port', String(TEST_PORT)],
    {
      cwd: projectDirectory,
      env: applicationEnvironment,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  serverProcess.stdout.on('data', appendServerLogs)
  serverProcess.stderr.on('data', appendServerLogs)

  const api = new ApiClient(baseUrl)
  const publicApi = new ApiClient(baseUrl)
  const localAdmin = createClient(apiUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const created = { customerId: null, orderId: null, containerId: null }
  const runId = `${Date.now()}-${process.pid}`
  const customerName = `API-TEST Client ${runId}`
  const customerEmail = `api-test-${runId}@example.test`
  let passed = 0

  async function step(label, test) {
    await test()
    passed += 1
    console.log(`✓ ${label}`)
  }

  try {
    console.log('DANEMO API business tests — local only')
    await waitForServer(api, serverProcess, () => serverLogs)

    await step('Les routes administratives refusent une requête anonyme', async () => {
      const result = await publicApi.request('/api/orders')
      expectStatus(result, 401, 'Anonymous orders access')
    })

    await step('Connexion au portail administrateur', async () => {
      const csrf = expectStatus(await api.request('/api/auth/csrf'), 200, 'CSRF token')
      assert(csrf?.csrfToken, 'NextAuth did not return a CSRF token.')

      expectStatus(
        await api.request('/api/auth/callback/credentials', {
          method: 'POST',
          form: {
            csrfToken: csrf.csrfToken,
            email: process.env.TEST_ADMIN_EMAIL || 'admin@danemo.be',
            password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
            callbackUrl: `${baseUrl}/admin`,
            json: 'true',
          },
        }),
        [200, 302],
        'Admin login',
      )

      const session = expectStatus(await api.request('/api/auth/session'), 200, 'Admin session')
      assert(session?.user?.role === 'admin', 'The authenticated local user is not an admin.')
      expectStatus(await api.request('/admin'), 200, 'Admin portal')
    })

    await step('Création d’un client', async () => {
      const payload = expectStatus(
        await api.request('/api/customers', {
          method: 'POST',
          json: {
            name: customerName,
            email: customerEmail,
            phone: '+41000000010',
            address: '10 rue API-TEST',
            city: 'Genève',
            postal_code: '1200',
            country: 'Suisse',
            notes: 'Créé par npm test',
          },
        }),
        201,
        'Create customer',
      )
      created.customerId = payload?.data?.id
      assert(created.customerId, 'Customer creation did not return an id.')
    })

    await step('Création d’un conteneur', async () => {
      const payload = expectStatus(
        await api.request('/api/containers', {
          method: 'POST',
          json: {
            code: `DT${Date.now().toString().slice(-9)}`,
            vessel: 'API-TEST Vessel',
            departure_port: 'Genève',
            arrival_port: 'Kinshasa',
            status: 'planned',
            client_id: created.customerId,
          },
        }),
        201,
        'Create container',
      )
      created.containerId = payload?.data?.id
      assert(created.containerId, 'Container creation did not return an id.')
    })

    await step('Modification du conteneur', async () => {
      const payload = expectStatus(
        await api.request(`/api/containers/${created.containerId}`, {
          method: 'PUT',
          json: { vessel: 'API-TEST Vessel Updated' },
        }),
        200,
        'Update container',
      )
      assert(payload?.data?.vessel === 'API-TEST Vessel Updated', 'Container update was not persisted.')
    })

    let orderNumber
    await step('Création d’une commande', async () => {
      const payload = expectStatus(
        await api.request('/api/orders', {
          method: 'POST',
          json: {
            customer_id: created.customerId,
            container_id: created.containerId,
            client_name: customerName,
            client_email: customerEmail,
            client_phone: '+41000000010',
            client_address: '10 rue API-TEST',
            client_city: 'Genève',
            client_postal_code: '1200',
            client_country: 'Suisse',
            recipient_name: 'API-TEST Destinataire',
            recipient_email: customerEmail,
            recipient_phone: '+243000000010',
            recipient_address: '20 avenue API-TEST',
            recipient_city: 'Kinshasa',
            recipient_postal_code: '00000',
            recipient_country: 'RDC',
            service_type: 'fret_maritime',
            description: 'Commande créée par npm test',
            origin: 'Genève',
            destination: 'Kinshasa',
            weight: 10,
            value: 100,
            parcels_count: 1,
          },
        }),
        201,
        'Create order',
      )
      created.orderId = payload?.data?.id
      orderNumber = payload?.data?.order_number
      assert(created.orderId && orderNumber, 'Order creation did not return its identifiers.')
    })

    await step('Modification de la commande', async () => {
      const payload = expectStatus(
        await api.request(`/api/orders/${created.orderId}`, {
          method: 'PUT',
          json: { description: 'Commande API-TEST modifiée' },
        }),
        200,
        'Update order',
      )
      assert(payload?.data?.description === 'Commande API-TEST modifiée', 'Order update was not persisted.')
    })

    await step('Tracking public par numéro de commande', async () => {
      const payload = expectStatus(
        await publicApi.request(`/api/orders/search?tracking=${encodeURIComponent(orderNumber)}`),
        200,
        'Public tracking search',
      )
      assert(payload?.data?.[0]?.id === created.orderId, 'Tracking search returned the wrong order.')

      const events = expectStatus(
        await publicApi.request(`/api/orders/${created.orderId}/tracking`),
        200,
        'Public tracking events',
      )
      assert(Array.isArray(events?.data), 'Tracking events response is not an array.')
    })

    await step('Récupération des données par QR code', async () => {
      const generated = expectStatus(
        await api.request(`/api/orders/${created.orderId}`, {
          method: 'PATCH',
          json: { action: 'generate-qr' },
        }),
        200,
        'Generate QR code',
      )
      const qrCode = generated?.data?.qr_code
      assert(qrCode, 'QR generation did not return a code.')

      const payload = expectStatus(
        await api.request(`/api/orders/${encodeURIComponent(qrCode)}`),
        200,
        'QR order lookup',
      )
      assert(payload?.data?.order?.id === created.orderId, 'QR lookup returned the wrong order.')
    })

    await step('Suppression de la commande', async () => {
      const orderId = created.orderId
      expectStatus(await api.request(`/api/orders/${orderId}`, { method: 'DELETE' }), 200, 'Delete order')
      expectStatus(await api.request(`/api/orders/${orderId}`), 404, 'Confirm order deletion')
      created.orderId = null
    })

    await step('Suppression du conteneur', async () => {
      const containerId = created.containerId
      expectStatus(
        await api.request(`/api/containers/${containerId}`, { method: 'DELETE' }),
        200,
        'Delete container',
      )
      expectStatus(await api.request(`/api/containers/${containerId}`), 404, 'Confirm container deletion')
      created.containerId = null
    })

    await step('Nettoyage du client synthétique', async () => {
      const customerId = created.customerId
      expectStatus(
        await api.request(`/api/customers/${customerId}`, {
          method: 'DELETE',
          json: { confirmationName: customerName },
        }),
        200,
        'Delete customer',
      )
      expectStatus(await api.request(`/api/customers/${customerId}`), 404, 'Confirm customer deletion')
      created.customerId = null
    })

    console.log(`\n${passed} tests métier API réussis.`)
  } catch (error) {
    if (serverLogs.trim()) {
      console.error('\nDerniers logs Next.js :')
      console.error(serverLogs.trim())
    }
    throw error
  } finally {
    if (created.orderId) await localAdmin.from('orders').delete().eq('id', created.orderId)
    if (created.containerId) await localAdmin.from('containers').delete().eq('id', created.containerId)
    if (created.customerId) await localAdmin.from('customers').delete().eq('id', created.customerId)
    await stopServer(serverProcess)
  }
}

main().catch((error) => {
  console.error(`\n✗ API tests failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
