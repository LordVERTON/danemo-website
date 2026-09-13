import { NextRequest, NextResponse } from "next/server"

import { getStaffApiActor, requireStaffApiAccess } from "@/lib/staff-api-auth"
import { receptionDb, type ReceptionWorkflowRow } from "@/lib/reception-db"

// GET /api/receptions - Brouillons de réception récents, réservés au personnel.
export async function GET(request: NextRequest) {
  const authError = await requireStaffApiAccess(request)
  if (authError) return authError

  try {
    const { data, error } = await receptionDb
      .from("reception_workflows")
      .select("id, customer_id, order_id, status, current_step, draft, created_by, created_by_email, started_at, completed_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30)

    if (error) throw error
    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error) {
    console.error("[receptions] Unable to list workflows", error)
    return NextResponse.json({ success: false, error: "Impossible de charger les réceptions." }, { status: 500 })
  }
}

// POST /api/receptions - Ouvre un brouillon de réception attribué à l'opérateur connecté.
export async function POST(request: NextRequest) {
  const authError = await requireStaffApiAccess(request)
  if (authError) return authError

  const actor = await getStaffApiActor(request)
  if (!actor) return NextResponse.json({ success: false, error: "Authentification requise." }, { status: 401 })

  try {
    const { data, error } = await receptionDb
      .from("reception_workflows")
      .insert({
        created_by: actor.id,
        created_by_email: actor.email,
        draft: {},
      })
      .select("id, customer_id, order_id, status, current_step, draft, created_by, created_by_email, started_at, completed_at, updated_at")
      .single()

    if (error) throw error
    const { error: eventsError } = await receptionDb.from("reception_step_events").insert(
      Array.from({ length: 8 }, (_, index) => ({
        workflow_id: data.id,
        step: index + 1,
        state: "todo" as const,
        operator_id: actor.id,
        operator_email: actor.email,
        note: null,
      })),
    )
    if (eventsError) throw eventsError
    return NextResponse.json({ success: true, data: data as ReceptionWorkflowRow }, { status: 201 })
  } catch (error) {
    console.error("[receptions] Unable to create workflow", error)
    return NextResponse.json({ success: false, error: "Impossible d’ouvrir la réception." }, { status: 500 })
  }
}
