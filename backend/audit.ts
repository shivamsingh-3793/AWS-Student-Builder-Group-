import type { AuthenticatedRequest } from './middleware/auth.ts';
import { supabase } from './supabase.ts';

export async function writeAdminAudit(
  req: AuthenticatedRequest,
  action: string,
  entity: string,
  entityId?: string | number,
): Promise<void> {
  if (!req.user) throw new Error('Administrator identity is unavailable for audit logging.');
  const { error } = await supabase.from('admin_audit_logs').insert({
    actor_id: req.user.id,
    action,
    entity,
    entity_id: entityId === undefined ? null : String(entityId),
  });
  if (error) throw new Error('Unable to record the administrator action.');
}
