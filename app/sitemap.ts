import type { MetadataRoute } from "next"

const BASE_URL = "https://www.danemo.be"

const ROUTES = [
  { path: "/", priority: 1 },
  { path: "/services", priority: 0.9 },
  { path: "/tarifs", priority: 0.9 },
  { path: "/tracking", priority: 0.7 },
  { path: "/contactez-nous", priority: 0.8 },
  { path: "/blog", priority: 0.6 },
  { path: "/blog/anciens", priority: 0.4 },
  { path: "/blog/entreprises-africaines", priority: 0.5 },
  { path: "/blog/envoi-conteneur-erreurs", priority: 0.5 },
  { path: "/blog/envoi-colis-afrique", priority: 0.5 },
  { path: "/blog/demenagement-diplomatique", priority: 0.5 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    priority: route.priority,
  }))
}
