"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Box, Loader2, PackageSearch, Search, UserRound, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type SearchKind = "all" | "orders" | "customers" | "containers"

type SearchResult = {
  id: string
  title: string
  description: string
  href: string
}

type SearchData = Record<Exclude<SearchKind, "all">, SearchResult[]>

const filters: Array<{ value: SearchKind; label: string }> = [
  { value: "all", label: "Tout" },
  { value: "orders", label: "Références" },
  { value: "customers", label: "Clients" },
  { value: "containers", label: "Conteneurs" },
]

const resultPresentation = {
  orders: { label: "Références et QR", icon: PackageSearch },
  customers: { label: "Clients", icon: UserRound },
  containers: { label: "Conteneurs", icon: Box },
} as const

function isSearchKind(value: string | null): value is SearchKind {
  return value === "all" || value === "orders" || value === "customers" || value === "containers"
}

export default function AdminGlobalSearch() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const persistedQuery = searchParams.get("search") || ""
  const searchType = searchParams.get("searchType")
  const persistedFilter: SearchKind = isSearchKind(searchType) ? searchType : "all"
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(persistedQuery)
  const [data, setData] = useState<SearchData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [name, value] of Object.entries(updates)) {
      if (value) params.set(name, value)
      else params.delete(name)
    }
    const serialized = params.toString()
    router.replace(serialized ? `${pathname}?${serialized}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const runSearch = useCallback(async (value: string) => {
    const normalized = value.trim()
    if (normalized.length < 2) {
      setData(null)
      setHasSearched(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(normalized)}`, { cache: "no-store" })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Recherche impossible")
      setData(result.data)
      setHasSearched(true)
    } catch (cause) {
      setData(null)
      setError(cause instanceof Error ? cause.message : "Recherche impossible")
      setHasSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setQuery(persistedQuery)
  }, [persistedQuery])

  useEffect(() => {
    if (searchParams.get("searchDialog") === "1") setOpen(true)
  }, [searchParams])

  useEffect(() => {
    if (open && persistedQuery.trim().length >= 2) void runSearch(persistedQuery)
  }, [open, persistedQuery, runSearch])

  const visibleGroups = useMemo(() => {
    if (!data) return []
    if (persistedFilter === "all") {
      return (["orders", "customers", "containers"] as const)
        .map((kind) => ({ kind, results: data[kind] }))
        .filter((group) => group.results.length > 0)
    }
    return [{ kind: persistedFilter, results: data[persistedFilter] }].filter((group) => group.results.length > 0)
  }, [data, persistedFilter])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen && searchParams.get("searchDialog")) updateUrl({ searchDialog: null })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = query.trim()
    if (normalized.length < 2) {
      setError("Saisissez au moins deux caractères pour rechercher.")
      return
    }
    updateUrl({ search: normalized, searchDialog: null })
    void runSearch(normalized)
  }

  function setFilter(filter: SearchKind) {
    updateUrl({ searchType: filter === "all" ? null : filter })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
          aria-label="Rechercher une référence, un client ou un conteneur"
        >
          <Search className="size-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xl gap-4 p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Recherche globale</DialogTitle>
          <DialogDescription>Référence, QR, client ou code conteneur.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="search"
            autoComplete="off"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex. DN2026…, Marie Dupont, MSKU…"
            aria-label="Terme de recherche"
          />
          <Button type="submit" disabled={loading} aria-label="Lancer la recherche">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            <span className="hidden sm:inline">Rechercher</span>
          </Button>
        </form>
        <div className="flex flex-wrap gap-2" aria-label="Filtrer les résultats">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={persistedFilter === filter.value ? "default" : "outline"}
              onClick={() => setFilter(filter.value)}
              aria-pressed={persistedFilter === filter.value}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <div aria-live="polite" className="max-h-[min(55vh,30rem)] overflow-y-auto">
          {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {!error && loading && <p className="flex items-center gap-2 py-5 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Recherche en cours…</p>}
          {!error && !loading && hasSearched && visibleGroups.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">Aucun résultat. Vérifiez la référence ou essayez un autre terme.</div>
          )}
          {!error && !loading && visibleGroups.map(({ kind, results }) => {
            const presentation = resultPresentation[kind]
            const Icon = presentation.icon
            return (
              <section key={kind} className="py-2 first:pt-0 last:pb-0" aria-labelledby={`search-group-${kind}`}>
                <h3 id={`search-group-${kind}`} className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700"><Icon className="size-4 text-orange-600" />{presentation.label}</h3>
                <ul className="divide-y rounded-lg border">
                  {results.map((result) => (
                    <li key={result.id}>
                      <Link href={result.href} onClick={() => setOpen(false)} className="block min-h-12 px-3 py-2.5 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600">
                        <span className="block font-medium text-slate-900">{result.title}</span>
                        <span className="block truncate text-sm text-slate-500">{result.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
        {persistedQuery && <Button type="button" variant="ghost" className="self-start" onClick={() => { setQuery(""); setData(null); setHasSearched(false); setError(""); updateUrl({ search: null, searchType: null }) }}><X className="size-4" />Effacer la recherche</Button>}
      </DialogContent>
    </Dialog>
  )
}
