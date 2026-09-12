/**
 * Tests d'intégration des workflows DANEMO.
 *
 * Prérequis : l'application et Supabase local sont démarrés. Cette suite refuse
 * toute URL non locale, crée uniquement des données marquées TEST-..., puis les
 * supprime. Les communications externes ne sont jamais envoyées : la campagne
 * de messagerie utilise dryRun et les commandes de test n'ont pas d'e-mail.
 *
 * Variables requises :
 * - TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
 * - TEST_OPERATOR_EMAIL / TEST_OPERATOR_PASSWORD
 *
 * Compatibilité : SMOKE_TEST_EMAIL et SMOKE_TEST_PASSWORD restent acceptées
 * pour le compte administrateur. TEST_BASE_URL (ou SMOKE_TEST_BASE_URL) vaut
 * http://127.0.0.1:3000 par défaut.
 */

import { randomUUID } from 'node:crypto'

const baseUrl = getLocalBaseUrl(
  process.env.TEST_BASE_URL ?? process.env.SMOKE_TEST_BASE_URL ?? 'http://127.0.0.1:3000',
)
const marker = `TEST-${randomUUID().slice(0, 8).toUpperCase()}`
const adminCredentials = {
  email: requiredEnv('TEST_ADMIN_EMAIL', 'SMOKE_TEST_EMAIL'),
  password: requiredEnv('TEST_ADMIN_PASSWORD', 'SMOKE_TEST_PASSWORD'),
}
const operatorCredentials = {
  email: requiredEnv('TEST_OPERATOR_EMAIL'),
  password: requiredEnv('TEST_OPERATOR_PASSWORD'),
}

const visitor = createClient('visiteur')
const admin = createClient('administrateur')
const operator = createClient('opérateur')
const resources = {
  customerId: null,
  publicCustomerId: null,
  containerId: null,
  orderId: null,
  publicOrderId: null,
  inventoryId: null,
  articleId: null,
  employeeId: null,
}
const results = []

function requiredEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
  throw new Error(`${names.join(' ou ')} est requis. Aucun identifiant n'est codé en dur.`)
}

function getLocalBaseUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('TEST_BASE_URL doit être une URL HTTP locale valide.')
  }

  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]'])
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    !localHosts.has(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error('Les tests de workflows refusent toute cible hors localhost.')
  }

  url.pathname = url.pathname.replace(/\/$/, '')
  return url
}

function endpoint(path) {
  return new URL(path, `${baseUrl.toString()}/`).toString()
}

function createClient(label) {
  const cookies = new Map()

  function rememberCookies(response) {
    const setCookies = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : []

    for (const setCookie of setCookies) {
      const firstPart = setCookie.split(';', 1)[0]
      const separator = firstPart.indexOf('=')
      if (separator > 0) cookies.set(firstPart.slice(0, separator), firstPart.slice(separator + 1))
    }
  }

  async function request(path, options = {}) {
    const headers = new Headers(options.headers)
    const cookieHeader = [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
    if (cookieHeader) headers.set('cookie', cookieHeader)

    const response = await fetch(endpoint(path), {
      ...options,
      headers,
      redirect: 'manual',
    })
    rememberCookies(response)
    return response
  }

  return { label, cookies, request }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function readPayload(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null
  return response.json().catch(() => null)
}

async function expectJson(client, path, method = 'GET', body, expectedStatus = 200) {
  const response = await client.request(path, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await readPayload(response)
  assert(
    response.status === expectedStatus,
    `${client.label} : ${method} ${path} a répondu ${response.status}, attendu ${expectedStatus} (${payload?.error ?? 'sans détail'}).`,
  )
  return payload
}

async function expectSuccess(client, path, method = 'GET', body, expectedStatus = 200) {
  const payload = await expectJson(client, path, method, body, expectedStatus)
  assert(payload?.success === true, `${client.label} : ${method} ${path} n'a pas retourné success: true.`)
  return payload
}

async function expectDenied(client, path, method = 'GET', body, expectedStatus) {
  const payload = await expectJson(client, path, method, body, expectedStatus)
  assert(payload?.success === false, `${client.label} : ${method} ${path} devait être refusé.`)
}

async function authenticate(client, credentials) {
  const csrfResponse = await client.request('/api/auth/csrf')
  const csrf = await readPayload(csrfResponse)
  assert(csrfResponse.ok && csrf?.csrfToken, `${client.label} : jeton CSRF introuvable.`)

  const form = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email: credentials.email,
    password: credentials.password,
    callbackUrl: endpoint('/admin'),
    json: 'true',
  })
  const loginResponse = await client.request('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  const result = await readPayload(loginResponse)
  const callbackUrl = result?.url ? new URL(result.url, baseUrl) : null
  const loginError = result?.error || callbackUrl?.searchParams.get('error')
  const hasSession = [...client.cookies.keys()].some((name) => name.includes('session-token'))
  assert(loginResponse.ok && !loginError && hasSession, `${client.label} : authentification refusée.`)
}

async function run(name, workflow, test) {
  try {
    await test()
    results.push({ name, workflow, status: 'ok' })
    console.log(`✓ [${workflow}] ${name}`)
  } catch (error) {
    results.push({ name, workflow, status: 'failed', error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

function customerPayload(name, email = null) {
  return {
    name,
    email,
    phone: '+32470000000',
    address: '1 rue des tests',
    city: 'Bruxelles',
    postal_code: '1000',
    country: 'Belgique',
    company: 'DANEMO Tests',
    opted_in_sms: true,
    opted_in_whatsapp: false,
  }
}

function orderPayload(customerId, containerId) {
  return {
    customer_id: customerId,
    client_name: `${marker} Client`,
    client_email: '',
    client_phone: '+32470000000',
    client_address: '1 rue des tests',
    client_city: 'Bruxelles',
    client_postal_code: '1000',
    client_country: 'Belgique',
    recipient_name: `${marker} Destinataire`,
    recipient_email: '',
    recipient_phone: '+2250700000000',
    recipient_address: '1 avenue de test',
    recipient_city: 'Abidjan',
    recipient_postal_code: '01 BP 1',
    recipient_country: "Côte d'Ivoire",
    service_type: 'fret_maritime',
    origin: 'Belgique',
    destination: "Côte d'Ivoire",
    description: 'Créée par la suite de tests automatisés',
    value: 250,
    container_id: containerId,
    parcels_count: 1,
  }
}

async function cleanup() {
  const deletions = [
    [admin, resources.articleId && `/api/admin/articles/${resources.articleId}`],
    [admin, resources.employeeId && `/api/employees/${resources.employeeId}`],
    [operator, resources.inventoryId && `/api/inventory/${resources.inventoryId}`],
    [operator, resources.orderId && `/api/orders/${resources.orderId}`],
    [admin, resources.publicOrderId && `/api/orders/${resources.publicOrderId}`],
    [operator, resources.containerId && `/api/containers/${resources.containerId}`],
    [operator, resources.customerId && `/api/customers/${resources.customerId}`],
    [admin, resources.publicCustomerId && `/api/customers/${resources.publicCustomerId}`],
  ].filter(([, path]) => path)

  for (const [client, path] of deletions) {
    try {
      const response = await client.request(path, { method: 'DELETE' })
      if (!response.ok) console.error(`Nettoyage incomplet : DELETE ${path} a répondu ${response.status}.`)
    } catch {
      console.error(`Nettoyage impossible : DELETE ${path}.`)
    }
  }
}

async function main() {
  console.log(`Tests d'intégration DANEMO sur ${baseUrl.origin} (${marker})`)

  await run('le serveur répond', 'pré-requis', async () => {
    const response = await visitor.request('/')
    assert(response.ok, `GET / a répondu ${response.status}. Démarrez l'application avant npm run test.`)
  })

  await run('les routes publiques sont accessibles', 'visiteur', async () => {
    await expectSuccess(visitor, '/api/public/tariff-items?lang=fr')
    await expectSuccess(visitor, '/api/public/tariff-items?lang=en')
    await expectSuccess(visitor, '/api/public/blog-posts')
    await expectSuccess(visitor, '/api/public/upcoming-departure')
    await expectSuccess(visitor, '/api/blog-posts')
    await expectSuccess(visitor, '/api/containers')
    await expectSuccess(visitor, `/api/orders/search?tracking=${marker}`)
  })

  await run('le visiteur ne peut pas lire les données internes', 'visiteur', async () => {
    await expectDenied(visitor, '/api/customers', 'GET', undefined, 401)
    await expectDenied(visitor, '/api/orders', 'GET', undefined, 401)
    await expectDenied(visitor, '/api/stats', 'GET', undefined, 401)
    await expectDenied(visitor, '/api/employees', 'GET', undefined, 401)
  })

  await run('l’inscription publique crée client et commande', 'visiteur', async () => {
    const payload = await expectSuccess(visitor, '/api/public/self-register', 'POST', {
      company_website: '',
      customer: { ...customerPayload(`${marker} Public`, ''), email: '' },
      articles: [{ source: 'custom', description: 'Colis de test', quantity: 1 }],
      shipment: {
        service_type: 'fret_maritime',
        origin: 'Belgique',
        destination: "Côte d'Ivoire",
        parcels_count: 1,
      },
      recipient: {
        name: `${marker} Destinataire public`,
        email: '',
        phone: '+2250700000000',
        address: '1 avenue de test',
        city: 'Abidjan',
        postal_code: '01 BP 1',
        country: "Côte d'Ivoire",
      },
    }, 201)
    resources.publicCustomerId = payload.data?.customerId
    resources.publicOrderId = payload.data?.orderId
    assert(resources.publicCustomerId && resources.publicOrderId && payload.data?.orderNumber, 'Inscription publique incomplète.')
    const tracking = await expectSuccess(visitor, `/api/orders/search?tracking=${encodeURIComponent(payload.data.orderNumber)}`)
    assert(Array.isArray(tracking.data) && tracking.data[0]?.order_number === payload.data.orderNumber, 'Commande publique introuvable.')
  })

  await run('les sessions admin et opérateur sont valides', 'authentification', async () => {
    await authenticate(admin, adminCredentials)
    await authenticate(operator, operatorCredentials)
  })

  await run('l’opérateur lit les volumes et reste bloqué sur les fonctions administrateur', 'opérateur', async () => {
    await expectSuccess(operator, '/api/stats')
    await expectDenied(operator, '/api/employees', 'GET', undefined, 403)
    await expectDenied(operator, '/api/admin/messages/send?mode=all', 'GET', undefined, 403)
    await expectDenied(operator, '/api/notifications/order-status', 'POST', { order_id: 'inexistant' }, 403)
  })

  await run('l’administrateur accède aux contrôles système', 'administrateur', async () => {
    await expectSuccess(admin, '/api/stats')
    await expectSuccess(admin, '/api/health')
    await expectSuccess(admin, '/api/employees')
  })

  await run('l’opérateur gère client, conteneur et commande', 'opérateur', async () => {
    const customer = await expectSuccess(operator, '/api/customers', 'POST', customerPayload(`${marker} Client`, `${marker.toLowerCase()}@smoke.invalid`), 201)
    resources.customerId = customer.data?.id
    assert(resources.customerId, 'Client de test sans identifiant.')

    const updatedCustomer = await expectSuccess(operator, `/api/customers/${resources.customerId}`, 'PUT', {
      ...customer.data,
      name: `${marker} Client modifié`,
    })
    assert(updatedCustomer.data?.name === `${marker} Client modifié`, 'Client non mis à jour.')

    const container = await expectSuccess(operator, '/api/containers', 'POST', {
      code: `${marker}-CTR`,
      vessel: 'Navire de test',
      departure_port: 'Anvers',
      arrival_port: 'Abidjan',
      status: 'planned',
      client_id: resources.customerId,
    }, 201)
    resources.containerId = container.data?.id
    assert(resources.containerId, 'Conteneur de test sans identifiant.')

    const updatedContainer = await expectSuccess(operator, `/api/containers/${resources.containerId}`, 'PUT', {
      vessel: 'Navire de test modifié',
    })
    assert(updatedContainer.data?.vessel === 'Navire de test modifié', 'Conteneur non mis à jour.')

    const order = await expectSuccess(operator, '/api/orders', 'POST', orderPayload(resources.customerId, resources.containerId), 201)
    resources.orderId = order.data?.id
    assert(resources.orderId && order.data?.order_number, 'Commande de test incomplète.')
    assert(order.data?.container_id === resources.containerId, 'Conteneur non associé à la commande.')
    assert(order.data?.container_code === `${marker}-CTR`, 'Code conteneur non synchronisé.')

    const orderRead = await expectSuccess(operator, `/api/orders/${resources.orderId}`)
    assert(orderRead.data?.id === resources.orderId, 'Commande non relue.')

    const updatedOrder = await expectSuccess(operator, `/api/orders/${resources.orderId}`, 'PUT', {
      description: 'Commande modifiée par la suite de tests',
    })
    assert(updatedOrder.data?.description === 'Commande modifiée par la suite de tests', 'Commande non modifiée.')

    // La commande de test ne porte aucun e-mail : ce changement couvre le
    // déclenchement de notification sans appeler de fournisseur externe.
    const statusContainer = await expectSuccess(operator, `/api/containers/${resources.containerId}`, 'PUT', {
      status: 'departed',
    })
    assert(statusContainer.data?.status === 'departed', 'Statut conteneur non mis à jour.')
  })

  await run('le suivi, le QR et les données de conteneur sont cohérents', 'suivi et QR', async () => {
    const containerStatusTracking = await expectSuccess(operator, `/api/orders/${resources.orderId}/tracking`)
    assert(
      containerStatusTracking.data?.some((event) =>
        event.status === 'departed'
        && event.description?.includes('Statut du conteneur')
        && event.operator === 'Système — conteneur'
      ),
      'Le changement de statut du conteneur est absent de l’historique de la commande.'
    )

    const tracking = await expectSuccess(operator, `/api/orders/${resources.orderId}/tracking`, 'POST', {
      status: 'confirmed',
      location: 'Anvers',
      description: 'Événement de test automatisé',
      operator: 'suite de tests',
    }, 201)
    assert(tracking.data?.order_id === resources.orderId, 'Événement de suivi non relié à la commande.')

    const qr = await expectSuccess(operator, `/api/orders/${resources.orderId}`, 'PATCH', { action: 'generate-qr' })
    assert(qr.data?.qr_code, 'QR de commande absent.')

    const publicTracking = await expectSuccess(visitor, `/api/orders/${encodeURIComponent(qr.data.qr_code)}/tracking`)
    assert(Array.isArray(publicTracking.data) && publicTracking.data.length > 0, 'Suivi public absent.')

    const containerOrders = await expectSuccess(operator, `/api/containers/${resources.containerId}/inventory`)
    assert(containerOrders.data?.some((item) => item.id === resources.orderId), 'Commande absente du conteneur.')

    const exportResponse = await operator.request(`/api/documents/clients-by-container?container_id=${resources.containerId}&format=xlsx`)
    assert(exportResponse.ok, `Export clients par conteneur refusé (${exportResponse.status}).`)
    assert((exportResponse.headers.get('content-type') || '').includes('spreadsheetml'), 'Export XLSX inattendu.')
  })

  await run('les règlements, la facture et l’inventaire fonctionnent', 'gestion opérationnelle', async () => {
    const payment = await expectSuccess(operator, `/api/customers/${resources.customerId}/payments`, 'POST', {
      amount: 25,
      currency: 'EUR',
      paid_at: '2026-01-15',
      payment_method: 'bank_transfer',
      reference: `${marker}-PAY`,
    }, 201)
    assert(payment.data?.customer_id === resources.customerId, 'Règlement non rattaché au client.')

    const invoice = await expectSuccess(operator, `/api/customers/${resources.customerId}/invoices`, 'POST', {
      order_id: resources.orderId,
      tax_rate: 20,
      due_date: '2026-02-15',
    }, 201)
    assert(invoice.data?.status === 'draft', 'Facture non créée en brouillon.')

    const inventory = await expectSuccess(operator, '/api/inventory', 'POST', {
      type: 'colis',
      reference: `${marker}-INV`,
      description: 'Article d’inventaire de test',
      client: `${marker} Client modifié`,
      status: 'en_stock',
      location: 'Entrepôt de test',
      valeur: '25',
      container_id: resources.containerId,
    }, 201)
    resources.inventoryId = inventory.data?.id
    assert(resources.inventoryId, 'Article d’inventaire sans identifiant.')

    const updatedInventory = await expectSuccess(operator, `/api/inventory/${resources.inventoryId}`, 'PUT', {
      status: 'en_transit',
    })
    assert(updatedInventory.data?.status === 'en_transit', 'Inventaire non mis à jour.')
  })

  await run('les contenus et les révisions sont gérés selon les rôles', 'blog', async () => {
    const created = await expectSuccess(operator, '/api/admin/articles', 'POST', {
      title: `${marker} Article`,
      slug: `${marker.toLowerCase()}-article`,
      excerpt: 'Article créé par la suite de tests.',
      status: 'draft',
      puck_content: { root: {}, content: [] },
    }, 201)
    resources.articleId = created.article?.id
    assert(resources.articleId, 'Article de test sans identifiant.')

    const updated = await expectSuccess(operator, `/api/admin/articles/${resources.articleId}`, 'PATCH', {
      title: `${marker} Article modifié`,
      revision_note: 'Révision créée par test automatisé',
    })
    assert(updated.article?.title === `${marker} Article modifié`, 'Article non mis à jour.')

    const revisions = await expectSuccess(operator, `/api/admin/article-revisions?article_id=${resources.articleId}`)
    assert(Array.isArray(revisions.revisions) && revisions.revisions.length > 0, 'Révision d’article absente.')

    await expectDenied(operator, `/api/admin/articles/${resources.articleId}`, 'DELETE', undefined, 403)
  })

  await run('l’administrateur gère collaborateurs et campagne en simulation', 'administrateur', async () => {
    const employee = await expectSuccess(admin, '/api/employees', 'POST', {
      name: `${marker} Collaborateur`,
      email: `${marker.toLowerCase()}-staff@smoke.invalid`,
      password: `Test-${randomUUID()}-A`,
      role: 'operator',
      salary: 1,
      position: 'Test',
      hire_date: '2026-01-15',
      is_active: true,
    }, 201)
    resources.employeeId = employee.data?.id
    assert(resources.employeeId, 'Collaborateur de test sans identifiant.')

    const activities = await expectSuccess(admin, `/api/employees/${resources.employeeId}/activities`)
    assert(Array.isArray(activities.data), 'Activités collaborateur invalides.')

    const campaign = await expectSuccess(admin, `/api/admin/messages/send`, 'POST', {
      mode: 'single',
      customer_id: resources.customerId,
      channel: 'sms',
      message: 'Message de test non envoyé.',
      dryRun: true,
    })
    assert(campaign.data?.dryRun === true && campaign.data?.sent === 0, 'La campagne aurait dû rester en simulation.')

    await expectDenied(admin, '/api/admin/seed-users', 'POST', {}, 401)
  })

  await run('l’administrateur peut supprimer l’article Puck de test', 'administrateur', async () => {
    await expectSuccess(admin, `/api/admin/articles/${resources.articleId}`, 'DELETE')
    resources.articleId = null
  })

  console.log(`\n${results.length} tests de workflows réussis.`)
}

try {
  await main()
} catch (error) {
  console.error(`\nTest de workflow échoué : ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await cleanup()
}
