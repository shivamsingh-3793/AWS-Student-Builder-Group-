import { createClient } from '@supabase/supabase-js';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import bcrypt from 'bcryptjs';
import './config.ts';
import { getBackendConfig } from './config.ts';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required by the backend.');
}

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function verifySupabaseConnection(): Promise<void> {
  const checks = await Promise.all([
    supabase.from('users').select('id', { head: true, count: 'exact' }).limit(0),
    supabase.from('events').select('id', { head: true, count: 'exact' }).limit(0),
    supabase.from('posts').select('id', { head: true, count: 'exact' }).limit(0),
    supabase.from('projects').select('id', { head: true, count: 'exact' }).limit(0),
    supabase.from('gallery').select('id', { head: true, count: 'exact' }).limit(0),
    supabase.from('team_members').select('id', { head: true, count: 'exact' }).limit(0),
    supabase.from('submissions').select('id', { head: true, count: 'exact' }).limit(0),
    supabase.from('community_stats').select('id', { head: true, count: 'exact' }).limit(0),
    supabase.from('app_config').select('key', { head: true, count: 'exact' }).limit(0),
    supabase.from('admin_sessions').select('id', { head: true, count: 'exact' }).limit(0),
    supabase.from('admin_audit_logs').select('id', { head: true, count: 'exact' }).limit(0),
  ]);
  if (checks.some(({ error }) => error)) {
    throw new Error('Supabase connection/schema verification failed.');
  }
  await synchronizeAdminConfiguration();
}

async function setAppConfig(key: string, value: string): Promise<void> {
  const { error } = await supabase.from('app_config').upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );
  if (error) throw new Error('Unable to synchronize admin configuration.');
}

async function synchronizeAdminConfiguration(): Promise<void> {
  const config = getBackendConfig();
  const { data: admin, error: adminError } = await supabase
    .from('users')
    .select('id, name, email, password_hash')
    .eq('role', 'admin')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (adminError) throw new Error('Unable to verify the configured admin account.');
  if (!admin) return;

  if (admin.name !== config.adminName) {
    const { error } = await supabase.from('users').update({ name: config.adminName }).eq('id', admin.id);
    if (error) throw new Error('Unable to synchronize the configured admin name.');
  }

  const { data: emailSync, error: emailConfigError } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'admin_email_synced')
    .maybeSingle();
  if (emailConfigError) throw new Error('Unable to read admin synchronization state.');
  const lastSyncedEmail = emailSync?.value ?? null;
  const emailCanBeSynced =
    lastSyncedEmail === null || admin.email.toLowerCase() === lastSyncedEmail.toLowerCase();
  if (emailCanBeSynced && admin.email.toLowerCase() !== config.adminEmail) {
    const { error } = await supabase.from('users').update({ email: config.adminEmail }).eq('id', admin.id);
    if (error) throw new Error('Unable to synchronize the configured admin email.');
  }
  await setAppConfig('admin_email_synced', emailCanBeSynced ? config.adminEmail : admin.email);

  const { data: passwordSync, error: passwordConfigError } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'admin_password_synced_hash')
    .maybeSingle();
  if (passwordConfigError) throw new Error('Unable to read admin synchronization state.');
  const currentPasswordHash = admin.password_hash;
  const lastSyncedPasswordHash = passwordSync?.value ?? null;

  if (lastSyncedPasswordHash === null) {
    const passwordHash = await bcrypt.hash(config.adminPassword, 12);
    const { error } = await supabase.from('users').update({ password_hash: passwordHash }).eq('id', admin.id);
    if (error) throw new Error('Unable to synchronize the configured admin password.');
    await setAppConfig('admin_password_synced_hash', passwordHash);
  } else if (await bcrypt.compare(config.adminPassword, lastSyncedPasswordHash)) {
    await setAppConfig(
      'admin_password_synced_hash',
      currentPasswordHash === lastSyncedPasswordHash ? lastSyncedPasswordHash : currentPasswordHash
    );
  } else if (currentPasswordHash === lastSyncedPasswordHash) {
    const passwordHash = await bcrypt.hash(config.adminPassword, 12);
    const { error } = await supabase.from('users').update({ password_hash: passwordHash }).eq('id', admin.id);
    if (error) throw new Error('Unable to synchronize the configured admin password.');
    await setAppConfig('admin_password_synced_hash', passwordHash);
  } else {
    await setAppConfig('admin_password_synced_hash', currentPasswordHash);
  }
}

export function asyncRoute<T extends Request = Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    void handler(req as T, res, next).catch(next);
  };
}
