import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getStaffApiActor, requireStaffApiAccess } from "@/lib/staff-api-auth"
import { receptionDb, type ReceptionDraft, type ReceptionJson, type ReceptionWorkflowRow } from "@/lib/reception-db"

const workflowIdSchema = z.string().uuid()
const receptionJsonSchema: z.ZodType<ReceptionJson> = z.lazy(() => z.union([
  z.string(), z.number(), z.boolean(), z.null(), z.array(receptionJsonSchema), z.record(z.string(), receptionJsonSchema),
]))
const draftSchema = z.record(z.string(), receptionJsonSchema)

const updateSchema = z.object({
  current_step: z.number().int().min(1).max(8).optional(),
  status: z.enum(["in_progress", "blocked", "completed"]).optional(),
  customer_id: z.string().uuid().nullable().optional(),
  order_id: z.string().uuid().nullable().optional(),
  draft: draftSchema.optional(),
  step_event: z.object({
    step: z.number().int().min(1).max(8),
    state: z.enum(["todo", "done", "blocked"]),
    note: z.string().trim().max(1000).optional(),
  }).optional(),
  incident: z.object({
    action: z.enum(["report", "acknowledge", "resolve"]),
    description: z.string().trim().max(2000).optional(),
    resolution: z.string().trim().max(2000).optional(),
  }).optional(),
})

type ReceptionWorkflow = ReceptionWorkflowRow

type StepEvent = {
  id: string
  workflow_id: string
  step: number
  state: "todo" | "done" | "blocked"
  operator_id: string | null
  operator_email: string | null
  note: string | null
  occurred_at: string
}

type ReceptionIncident = {
  id: string
  workflow_id: string
  status: "reported" | "acknowledged" | "resolved"
  description: string
  reported_by: string | null
  reported_at: string
  resolution: string | null
  resolved_by: string | null
  resolved_at: string | null
  updated_at: string
}

async function getWorkflow(id: string) {
  const { data, error } = await receptionDb
    .from("reception_workflows")
    .select("id, customer_id, order_id, status, current_step, draft, created_by, created_by_email, started_at, completed_at, updated_at")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data as ReceptionWorkflow | null
}

// GET /api/receptions/[id] - Réception, étapes et incident associé.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireStaffApiAccess(request)
  if (authError) return authError

  const { id } = await context.params
  if (!workflowIdSchema.safeParse(id).success) {
    return NextResponse.json({ success: false, error: "Identifiant de réception invalide." }, { status: 400 })
  }

  try {
    const [workflow, eventsResult, incidentResult] = await Promise.all([
      getWorkflow(id),
      receptionDb.from("reception_step_events").select("id, workflow_id, step, state, operator_id, operator_email, note, occurred_at").eq("workflow_id", id).order("occurred_at", { ascending: true }),
      receptionDb.from("reception_incidents").select("id, workflow_id, status, description, reported_by, reported_at, resolution, resolved_by, resolved_at, updated_at").eq("workflow_id", id).maybeSingle(),
    ])
    if (!workflow) return NextResponse.json({ success: false, error: "Réception introuvable." }, { status: 404 })
    if (eventsResult.error || incidentResult.error) throw eventsResult.error || incidentResult.error

    return NextResponse.json({
      success: true,
      data: {
        workflow,
        events: (eventsResult.data ?? []) as StepEvent[],
        incident: incidentResult.data as ReceptionIncident | null,
      },
    })
  } catch (error) {
    console.error("[receptions] Unable to load workflow", error)
    return NextResponse.json({ success: false, error: "Impossible de charger cette réception." }, { status: 500 })
  }
}

// PATCH /api/receptions/[id] - Enregistre le brouillon, une étape ou le cycle de vie d'un incident.
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await requireStaffApiAccess(request)
  if (authError) return authError

  const actor = await getStaffApiActor(request)
  if (!actor) return NextResponse.json({ success: false, error: "Authentification requise." }, { status: 401 })

  const { id } = await context.params
  if (!workflowIdSchema.safeParse(id).success) {
    return NextResponse.json({ success: false, error: "Identifiant de réception invalide." }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Données de réception invalides." }, { status: 400 })
  }
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Données de réception invalides." }, { status: 400 })
  }

  try {
    const workflow = await getWorkflow(id)
    if (!workflow) return NextResponse.json({ success: false, error: "Réception introuvable." }, { status: 404 })

    const update = parsed.data
    if (update.incident && update.incident.action !== "report" && actor.role !== "admin") {
      return NextResponse.json({ success: false, error: "Seul un administrateur peut traiter un incident." }, { status: 403 })
    }
    const incidentDescription = update.incident?.description
    if (update.incident?.action === "report" && !incidentDescription) {
      return NextResponse.json({ success: false, error: "Décrivez le problème à signaler." }, { status: 400 })
    }

    const workflowUpdate = {
      ...(update.current_step !== undefined ? { current_step: update.current_step } : {}),
      ...(update.status !== undefined ? { status: update.status } : {}),
      ...(update.customer_id !== undefined ? { customer_id: update.customer_id } : {}),
      ...(update.order_id !== undefined ? { order_id: update.order_id } : {}),
      ...(update.draft ? { draft: { ...(workflow.draft || {}), ...update.draft } } : {}),
      ...(update.status === "completed" ? { completed_at: new Date().toISOString() } : {}),
    }

    const { data: updatedWorkflow, error: workflowError } = await receptionDb
      .from("reception_workflows")
      .update(workflowUpdate)
      .eq("id", id)
      .select("id, customer_id, order_id, status, current_step, draft, created_by, created_by_email, started_at, completed_at, updated_at")
      .single()
    if (workflowError) throw workflowError

    if (update.step_event) {
      const { error: stepError } = await receptionDb.from("reception_step_events").insert({
        workflow_id: id,
        step: update.step_event.step,
        state: update.step_event.state,
        operator_id: actor.id,
        operator_email: actor.email,
        note: update.step_event.note || null,
      })
      if (stepError) throw stepError
    }

    let incident: ReceptionIncident | null = null
    if (update.incident) {
      if (update.incident.action === "report") {
        const { data, error } = await receptionDb
          .from("reception_incidents")
          .upsert({
            workflow_id: id,
            status: "reported",
            description: incidentDescription!,
            reported_by: actor.email,
            reported_at: new Date().toISOString(),
            resolution: null,
            resolved_by: null,
            resolved_at: null,
          }, { onConflict: "workflow_id" })
          .select("id, workflow_id, status, description, reported_by, reported_at, resolution, resolved_by, resolved_at, updated_at")
          .single()
        if (error) throw error
        incident = data as ReceptionIncident
      } else {
        const incidentUpdate: { status: "acknowledged" | "resolved"; resolution?: string | null; resolved_by?: string | null; resolved_at?: string | null } = update.incident.action === "resolve"
          ? { status: "resolved", resolution: update.incident.resolution || null, resolved_by: actor.email, resolved_at: new Date().toISOString() }
          : { status: "acknowledged" }
        const { data, error } = await receptionDb
          .from("reception_incidents")
          .update(incidentUpdate)
          .eq("workflow_id", id)
          .select("id, workflow_id, status, description, reported_by, reported_at, resolution, resolved_by, resolved_at, updated_at")
          .maybeSingle()
        if (error) throw error
        if (!data) return NextResponse.json({ success: false, error: "Incident introuvable." }, { status: 404 })
        incident = data as ReceptionIncident
      }
    }

    return NextResponse.json({ success: true, data: { workflow: updatedWorkflow as ReceptionWorkflow, incident } })
  } catch (error) {
    console.error("[receptions] Unable to update workflow", error)
    return NextResponse.json({ success: false, error: "Impossible d’enregistrer la réception." }, { status: 500 })
  }
}
