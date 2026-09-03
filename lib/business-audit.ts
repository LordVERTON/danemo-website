import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getStaffApiActor } from '@/lib/staff-api-auth'

type BusinessAuditAction = 'create' | 'update' | 'delete'
type BusinessAuditEntity = 'customer' | 'order' | 'payment' | 'container' | 'content'

type BusinessAuditEvent = {
  action: BusinessAuditAction
  entityType: BusinessAuditEntity
  entityId: string
  changedFields?: string[]
}

// Intentionally records field names, never field values, to avoid copying PII into the audit trail.
export async function recordBusinessAudit(request: NextRequest, event: BusinessAuditEvent): Promise<void> {
  const actor = await getStaffApiActor(request)
  if (!actor) return

  const { error } = await (supabaseAdmin as any)
    .from('business_audit_log')
    .insert({
      actor_id: actor.id,
      actor_email: actor.email,
      actor_role: actor.role,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId,
      metadata: event.changedFields?.length ? { changed_fields: event.changedFields } : {},
    })

  if (error) {
    console.error('Failed to record business audit event', {
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
    })
  }
}
