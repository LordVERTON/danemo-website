/**
 * Smoke test des flux métier essentiels.
 *
 * Usage (après avoir démarré l'application localement) :
 *   $env:SMOKE_TEST_EMAIL='...'; $env:SMOKE_TEST_PASSWORD='...'; node scripts/smoke-business-workflows.mjs
 *
 * Variables optionnelles :
 *   SMOKE_TEST_BASE_URL=http://127.0.0.1:3000
 *
 * Ce test crée, lit, modifie, puis supprime son propre client, conteneur et
 * commande. Il refuse volontairement toute cible qui n'est pas localhost.
 */

import { randomUUID } from 'node:crypto'

const baseUrl = getLocalBaseUrl(process.env.SMOKE_TEST_BASE_URL ?? 'http://127.0.0.1:3000')
const email = requiredEnv('SMOKE_TEST_EMAIL')
const password = requiredEnv('SMOKE_TEST_PASSWORD')
const marker = `SMOKE-${randomUUID().slice(0, 8).toUpperCase()}`
const cookies = new Map()

let customerId
let containerId
let orderId
let customerName = `${marker} Client`

function requiredEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} est requis. Les identifiants ne sont jamais codés en dur.`)
  }
  return value
}

function getLocalBaseUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('SMOKE_TEST_BASE_URL doit être une URL HTTP locale valide.')
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
    throw new Error('Refus de lancer le smoke test hors de localhost.')
  }

  url.pathname = url.pathname.replace(/\/$/, '')
  return url
}

function endpoint(path) {
  return new URL(path, `${baseUrl.toString()}/`).toString()
}

function rememberCookies(response) {
  const setCookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : []

  for (const setCookie of setCookies) {
    const firstPart = setCookie.split(';', 1)[0]
    const separator = firstPart.indexOf('=')
    if (separator > 0) {
      cookies.set(firstPart.slice(0, separator), firstPart.slice(separator + 1))
    }
  }
}

function cookieHeader() {
  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers)
  const cookie = cookieHeader()
  if (cookie) headers.set('cookie', cookie)

  const response = await fetch(endpoint(path), {
    ...options,
    headers,
    redirect: 'manual',
  })
  rememberCookies(response)
  return response
}

async function jsonRequest(path, method, body) {
  const response = await request(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(`${method} ${path} a échoué (${response.status}) : ${payload?.error ?? 'réponse invalide'}`)
  }
  return payload
}

async function expectRead(path, expectedField, expectedValue) {
  const payload = await jsonRequest(path, 'GET')
  if (payload.data?.[expectedField] !== expectedValue) {
    throw new Error(`GET ${path} n'a pas retourné la valeur attendue pour ${expectedField}.`)
  }
  return payload.data
}

async function expectDeleted(path) {
  const response = await request(path)
  if (response.status !== 404) {
    const payload = await response.json().catch(() => null)
    throw new Error(`Suppression non vérifiée pour ${path} (${response.status}) : ${payload?.error ?? 'réponse inattendue'}`)
  }
}

async function authenticate() {
  const csrfResponse = await request('/api/auth/csrf')
  const csrf = await csrfResponse.json().catch(() => null)
  if (!csrfResponse.ok || !csrf?.csrfToken) {
    throw new Error(`Impossible d'obtenir le jeton CSRF (${csrfResponse.status}).`)
  }

  const form = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email,
    password,
    callbackUrl: endpoint('/admin'),
    json: 'true',
  })
  const loginResponse = await request('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  const result = await loginResponse.json().catch(() => null)
  const callbackUrl = result?.url ? new URL(result.url, baseUrl) : null
  const loginError = result?.error || callbackUrl?.searchParams.get('error')
  const hasSessionCookie = [...cookies.keys()].some((name) => name.includes('session-token'))
  if (!loginResponse.ok || loginError || !hasSessionCookie) {
    throw new Error(`Authentification du smoke test refusée (${loginResponse.status}).`)
  }
}

async function main() {
  console.log(`Smoke test métier sur ${baseUrl.origin} (${marker})`)
  await authenticate()

  const customer = await jsonRequest('/api/customers', 'POST', {
    name: customerName,
    email: `${marker.toLowerCase()}@smoke.invalid`,
    phone: '+32470000000',
    address: '1 rue du Smoke Test',
    city: 'Bruxelles',
    postal_code: '1000',
    country: 'Belgique',
    company: 'Danemo Smoke Test',
  })
  customerId = customer.data?.id
  if (!customerId) throw new Error('Création client sans identifiant.')
  await expectRead(`/api/customers/${customerId}`, 'id', customerId)

  const updatedCustomerName = `${marker} Client modifié`
  await jsonRequest(`/api/customers/${customerId}`, 'PUT', {
    ...customer.data,
    name: updatedCustomerName,
  })
  customerName = updatedCustomerName
  await expectRead(`/api/customers/${customerId}`, 'name', updatedCustomerName)

  const container = await jsonRequest('/api/containers', 'POST', {
    code: `${marker}-CTR`,
    vessel: 'Smoke Vessel',
    departure_port: 'Anvers',
    arrival_port: 'Abidjan',
    status: 'planned',
    client_id: customerId,
  })
  containerId = container.data?.id
  if (!containerId) throw new Error('Création conteneur sans identifiant.')
  await expectRead(`/api/containers/${containerId}`, 'id', containerId)

  const updatedVessel = 'Smoke Vessel modifié'
  await jsonRequest(`/api/containers/${containerId}`, 'PUT', { vessel: updatedVessel })
  await expectRead(`/api/containers/${containerId}`, 'vessel', updatedVessel)

  const order = await jsonRequest('/api/orders', 'POST', {
    customer_id: customerId,
    client_name: updatedCustomerName,
    client_email: `${marker.toLowerCase()}@smoke.invalid`,
    client_phone: '+32470000000',
    client_address: '1 rue du Smoke Test',
    client_city: 'Bruxelles',
    client_postal_code: '1000',
    client_country: 'Belgique',
    recipient_name: `${marker} Destinataire`,
    recipient_phone: '+2250700000000',
    recipient_address: '1 avenue de test',
    recipient_city: 'Abidjan',
    recipient_postal_code: '01 BP 1',
    recipient_country: "Côte d'Ivoire",
    service_type: 'fret_maritime',
    origin: 'Belgique',
    destination: "Côte d'Ivoire",
    description: 'Créée par le smoke test métier',
    container_id: containerId,
    container_code: `${marker}-CTR`,
    parcels_count: 1,
  })
  orderId = order.data?.id
  if (!orderId) throw new Error('Création commande sans identifiant.')
  await expectRead(`/api/orders/${orderId}`, 'id', orderId)

  const updatedDescription = 'Commande modifiée par le smoke test métier'
  await jsonRequest(`/api/orders/${orderId}`, 'PUT', { description: updatedDescription })
  await expectRead(`/api/orders/${orderId}`, 'description', updatedDescription)

  await jsonRequest(`/api/orders/${orderId}`, 'DELETE')
  orderId = undefined
  await expectDeleted(`/api/orders/${order.data.id}`)

  await jsonRequest(`/api/containers/${containerId}`, 'DELETE')
  containerId = undefined
  await expectDeleted(`/api/containers/${container.data.id}`)

  await jsonRequest(`/api/customers/${customerId}`, 'DELETE', { confirmationName: customerName })
  customerId = undefined
  await expectDeleted(`/api/customers/${customer.data.id}`)

  console.log('Smoke test métier réussi : CRUD client, conteneur et commande validés.')
}

async function cleanup() {
  const pending = [
    orderId && ['/api/orders', orderId],
    containerId && ['/api/containers', containerId],
    customerId && ['/api/customers', customerId],
  ].filter(Boolean)

  for (const [collection, id] of pending) {
    try {
      const body = collection === '/api/customers' ? { confirmationName: customerName } : undefined
      await jsonRequest(`${collection}/${id}`, 'DELETE', body)
      console.log(`Nettoyage effectué : ${collection}/${id}`)
    } catch (error) {
      console.error(`Échec du nettoyage de ${collection}/${id}:`, error instanceof Error ? error.message : error)
    }
  }
}

try {
  await main()
} catch (error) {
  console.error('Smoke test métier échoué:', error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await cleanup()
}
