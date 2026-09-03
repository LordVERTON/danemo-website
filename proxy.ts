import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PATHS = new Set(["/admin/login"])
const ADMIN_ONLY_PREFIXES = ["/admin/analytics", "/admin/employees"]
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
