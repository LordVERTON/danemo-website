import type { SupabaseClient } from "@supabase/supabase-js"

import { supabaseAdmin } from "@/lib/supabase"

export type ReceptionJson = string | number | boolean | null | { [key: string]: ReceptionJson } | ReceptionJson[]
export type ReceptionDraft = { [key: string]: ReceptionJson | undefined }

export type ReceptionWorkflowRow = {
  id: string
  customer_id: string | null
  order_id: string | null
  status: "in_progress" | "blocked" | "completed"
  current_step: number
  draft: ReceptionDraft
  created_by: string | null
  created_by_email: string | null
  started_at: string
  completed_at: string | null
  updated_at: string
}

type ReceptionStepEventRow = { id: string; workflow_id: string; step: number; state: "todo" | "done" | "blocked"; operator_id: string | null; operator_email: string | null; note: string | null; occurred_at: string }
type ReceptionIncidentRow = { id: string; workflow_id: string; status: "reported" | "acknowledged" | "resolved"; description: string; reported_by: string | null; reported_at: string; resolution: string | null; resolved_by: string | null; resolved_at: string | null; updated_at: string }
type ReceptionTable<Row, Insert, Update> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] }

type ReceptionDatabase = {
  public: {
    Tables: {
      reception_workflows: ReceptionTable<ReceptionWorkflowRow, Partial<Omit<ReceptionWorkflowRow, "id" | "started_at" | "updated_at">>, Partial<Omit<ReceptionWorkflowRow, "id">>>
      reception_step_events: ReceptionTable<ReceptionStepEventRow, Omit<ReceptionStepEventRow, "id" | "occurred_at"> & Partial<Pick<ReceptionStepEventRow, "id" | "occurred_at" | "operator_id" | "operator_email" | "note">>, Partial<Omit<ReceptionStepEventRow, "id">>>
      reception_incidents: ReceptionTable<ReceptionIncidentRow, Omit<ReceptionIncidentRow, "id" | "reported_at" | "updated_at"> & Partial<Pick<ReceptionIncidentRow, "id" | "reported_at" | "updated_at" | "status" | "reported_by" | "resolution" | "resolved_by" | "resolved_at">>, Partial<Omit<ReceptionIncidentRow, "id">>>
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export const receptionDb = supabaseAdmin as unknown as SupabaseClient<ReceptionDatabase>
