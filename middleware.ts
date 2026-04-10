import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = new Set(["/admin/login"])
const ADMIN_ONLY_PREFIXES = ["/admin/analytics", "/admin/employees"]
const AUTH_REQUIRED_API_PREFIXES = ["/api/stats", "/api/employees", "/api/admin"]
const ADMIN_ONLY_API_PREFIXES = ["/api/stats", "/api/employees", "/api/admin"]

function hasPortalSession(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get("danemo_admin_session")?.value
  return sessionCookie === "authenticated"
}

function isAdmin(request: NextRequest): boolean {
  const roleCookie = request.cookies.get("danemo_admin_role")?.value
  return roleCookie === "admin"
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isApiRoute = pathname.startsWith("/api/")

  if (isApiRoute) {
    const isProtectedApi = AUTH_REQUIRED_API_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )

    if (!isProtectedApi) {
      return NextResponse.next()
    }

    if (!hasPortalSession(request)) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      )
    }

    const isAdminOnlyApi = ADMIN_ONLY_API_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )

    if (isAdminOnlyApi && !isAdmin(request)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      )
    }

    return NextResponse.next()
  }

  if (PUBLIC_PATHS.has(pathname)) {
    if (hasPortalSession(request)) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.next()
  }

  if (!hasPortalSession(request)) {
    const loginUrl = new URL("/admin/login", request.url)
    const returnTo = `${pathname}${search}`
    loginUrl.searchParams.set("returnTo", returnTo)
    return NextResponse.redirect(loginUrl)
  }

  const isAdminOnlyPath = ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isAdminOnlyPath && !isAdmin(request)) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images).*)",
  ],
}
