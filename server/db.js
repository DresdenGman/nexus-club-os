import { createClient } from '@supabase/supabase-js';

let supabase = null;

export function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

// === Clubs ===
export async function getClubs() {
  const { data, error } = await getSupabase().from('clubs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createClub(club) {
  const { data, error } = await getSupabase().from('clubs').insert(club).select().single();
  if (error) throw error;
  return data;
}

export async function updateClub(id, updates) {
  const { data, error } = await getSupabase().from('clubs').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClub(id) {
  const { error } = await getSupabase().from('clubs').delete().eq('id', id);
  if (error) throw error;
}

// === Approvals ===
export async function getApprovals(uid) {
  let query = getSupabase().from('approvals').select('*').order('created_at', { ascending: false });
  if (uid) query = query.eq('applicant_id', uid);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createApproval(approval) {
  const { data, error } = await getSupabase().from('approvals').insert(approval).select().single();
  if (error) throw error;
  return data;
}

export async function updateApproval(id, updates) {
  const { data, error } = await getSupabase().from('approvals').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteApproval(id) {
  const { error } = await getSupabase().from('approvals').delete().eq('id', id);
  if (error) throw error;
}

// === Users ===
export async function getUsers() {
  const { data, error } = await getSupabase().from('users').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createUser(user) {
  const { data, error } = await getSupabase().from('users').insert(user).select().single();
  if (error) throw error;
  return data;
}

export async function deleteUser(id) {
  const { error } = await getSupabase().from('users').delete().eq('id', id);
  if (error) throw error;
}
