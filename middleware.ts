import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PATHS = new Set(["/admin/login"])
const ADMIN_ONLY_PREFIXES = ["/admin/analytics", "/admin/employees"]
const AUTH_REQUIRED_API_PREFIXES = ["/api/stats", "/api/employees", "/api/admin", "/api/blog-posts", "/api/blog-media"]
const ADMIN_ONLY_API_PREFIXES = ["/api/stats", "/api/employees", "/api/admin"]
const OPERATOR_ALLOWED_ADMIN_API_PREFIXES = ["/api/admin/articles", "/api/admin/article-revisions", "/api/admin/media"]

function hasLegacyPortalSession(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get("danemo_admin_session")?.value
  return sessionCookie === "authenticated"
}

function isLegacyAdmin(request: NextRequest): boolean {
  const roleCookie = request.cookies.get("danemo_admin_role")?.value
  return roleCookie === "admin"
}

async function getAuthState(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  })
  const nextAuthRole = token?.role === "admin" ? "admin" : token?.role === "operator" ? "operator" : null

  return {
    isAuthenticated: hasLegacyPortalSession(request) || Boolean(token),
    isAdmin: isLegacyAdmin(request) || nextAuthRole === "admin",
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isApiRoute = pathname.startsWith("/api/")
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/")

  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next()
  }

  const authState = await getAuthState(request)

  if (isApiRoute) {
    if (pathname === "/api/blog-posts" && request.method === "GET") {
      return NextResponse.next()
    }

    const isProtectedApi = AUTH_REQUIRED_API_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )

    if (!isProtectedApi) {
      return NextResponse.next()
    }

    if (!authState.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      )
    }

    const isAdminOnlyApi = ADMIN_ONLY_API_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
    const isOperatorAllowedAdminApi = OPERATOR_ALLOWED_ADMIN_API_PREFIXES.some(
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
