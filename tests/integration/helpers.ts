import { createClient } from '@supabase/supabase-js';

export const URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
export const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export const admin = () =>
  createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function makeUser(email: string) {
  const a = admin();
  const { data, error } = await a.auth.admin.createUser({
    email, password: 'senha-forte-123', email_confirm: true,
  });
  if (error) throw error;
  const client = createClient(URL, ANON_KEY, { auth: { persistSession: false } });
  await client.auth.signInWithPassword({ email, password: 'senha-forte-123' });
  return { id: data.user!.id, client };
}
