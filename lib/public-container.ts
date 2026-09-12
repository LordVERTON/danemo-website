import type { Database } from "./supabase"

type Container = Database["public"]["Tables"]["containers"]["Row"]

export type PublicContainer = Omit<Container, "client_id">

export function toPublicContainer(container: Container): PublicContainer {
  return {
    id: container.id,
    code: container.code,
    vessel: container.vessel,
    departure_port: container.departure_port,
    arrival_port: container.arrival_port,
    etd: container.etd,
    eta: container.eta,
    status: container.status,
    created_at: container.created_at,
    updated_at: container.updated_at,
  }
}
