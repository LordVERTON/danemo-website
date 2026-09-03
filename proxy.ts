import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PATHS = new Set(["/admin/login"])
const ADMIN_ONLY_PREFIXES = ["/admin/analytics", "/admin/employees"]

type RateLimitPolicy = {
  name: string
  limit: number
  windowMs: number
}

type RateLimitCounter = {
  count: number
  resetAt: number
}

const rateLimitCounters = new Map<string, RateLimitCounter>()

function getClientIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const ip = forwardedFor?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || request.headers.get("cf-connecting-ip")

  // L'hébergeur doit renseigner l'adresse cliente. Cette valeur de repli évite
  // de traiter tous les clients comme une seule adresse lors du développement.
  return ip || request.headers.get("user-agent") || "unknown"
}

function getRateLimitPolicy(pathname: string, method: string, isPublicTrackingRoute: boolean): RateLimitPolicy | null {
  if (pathname === "/api/auth/callback/credentials" && method === "POST") {
    return { name: "login", limit: 5, windowMs: 15 * 60 * 1000 }
  }

  if (pathname === "/api/public/self-register" && method === "POST") {
    return { name: "self-register", limit: 5, windowMs: 15 * 60 * 1000 }
  }

  if (isPublicTrackingRoute) {
    return { name: "public-tracking", limit: 60, windowMs: 60 * 1000 }
  }

  if (pathname === "/api/qr/scan" && method === "POST") {
    return { name: "qr-scan", limit: 120, windowMs: 60 * 1000 }
  }

  if (/^\/api\/orders\/[^/]+\/tracking$/i.test(pathname) && method === "POST") {
    return { name: "tracking-update", limit: 60, windowMs: 60 * 1000 }
  }

  if (pathname === "/api/send-email" && method === "POST") {
    return { name: "send-email", limit: 10, windowMs: 10 * 60 * 1000 }
  }

  if (pathname === "/api/admin/messages/send" && method === "POST") {
    return { name: "bulk-message", limit: 5, windowMs: 10 * 60 * 1000 }
  }

  return null
}

function checkRateLimit(request: NextRequest, policy: RateLimitPolicy) {
  const now = Date.now()
  const key = `${policy.name}:${getClientIdentifier(request)}`
  const counter = rateLimitCounters.get(key)

  if (!counter || counter.resetAt <= now) {
    const resetAt = now + policy.windowMs
    rateLimitCounters.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: policy.limit - 1, resetAt }
  }

  counter.count += 1
  const allowed = counter.count <= policy.limit
  return {
    allowed,
    remaining: Math.max(0, policy.limit - counter.count),
    resetAt: counter.resetAt,
  }
}

function rateLimitResponse(policy: RateLimitPolicy, resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
  return NextResponse.json(
    { success: false, error: "Trop de requêtes. Réessayez dans quelques instants." },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(policy.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    },
  )
}

async function getAuthState(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  })
  const nextAuthRole = token?.role === "admin" ? "admin" : token?.role === "operator" ? "operator" : null

  return { isAuthenticated: Boolean(nextAuthRole), isAdmin: nextAuthRole === "admin" }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isApiRoute = pathname.startsWith("/api/")
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/")
  const publicTrackingRoute = /^\/api\/orders\/[^/]+\/tracking$/i.test(pathname)
    && request.method === "GET"
    && !/^\/api\/orders\/[0-9a-f]{8}-[0-9a-f-]{27}\/tracking$/i.test(pathname)

  const rateLimitPolicy = getRateLimitPolicy(pathname, request.method, publicTrackingRoute)
  if (rateLimitPolicy) {
    const rateLimit = checkRateLimit(request, rateLimitPolicy)
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimitPolicy, rateLimit.resetAt)
    }
  }

  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next()
  }

  const authState = await getAuthState(request)

  if (isApiRoute) {
    if (
      (pathname === "/api/blog-posts" && request.method === "GET") ||
      pathname.startsWith("/api/public/") ||
      (pathname === "/api/orders/search" && request.method === "GET") ||
      publicTrackingRoute
    ) {
      return NextResponse.next()
    }

    if (!authState.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      )
    }

    const isAdminOnlyApi = ["/api/stats", "/api/employees", "/api/admin", "/api/health", "/api/test-connection"].some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
    const isOperatorAllowedAdminApi = ["/api/admin/articles", "/api/admin/article-revisions", "/api/admin/media"].some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )

    if (isAdminOnlyApi && !isOperatorAllowedAdminApi && !authState.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      )
    }

    return NextResponse.next()
  }

  if (!isAdminRoute) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.has(pathname)) {
    if (authState.isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.next()
  }

  if (!authState.isAuthenticated) {
    const loginUrl = new URL("/admin/login", request.url)
    const returnTo = `${pathname}${search}`
    loginUrl.searchParams.set("returnTo", returnTo)
    return NextResponse.redirect(loginUrl)
  }

  const isAdminOnlyPath = ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isAdminOnlyPath && !authState.isAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images).*)",
  ],
}
