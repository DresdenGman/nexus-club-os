// API client for Nexus Club OS backend
const API_BASE = window.location.origin + '/api';

async function request(path: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('__auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...headers, ...(options.headers || {}) },
    ...options,
  });

  // Auto-logout on expired token
  if (res.status === 401 && token) {
    sessionStorage.removeItem('__auth_token');
    location.reload();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth API ──

export async function signup(email: string, password: string, name: string, department?: string) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, department }),
  });
}

export async function login(email: string, password: string) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getSession() {
  return request('/auth/session');
}

export interface AuthResult {
  user: { uid: string; email: string; displayName?: string } | null;
  profile: { uid: string; name: string; email: string; role: string; department?: string; joinDate?: string; contribution?: number; avatar?: string } | null;
  session?: { access_token: string; refresh_token: string };
}

// ── Data API ──

export async function fetchClubs() {
  return request('/data/clubs');
}

export async function createClub(club: Record<string, unknown>) {
  return request('/data/clubs', { method: 'POST', body: JSON.stringify(club) });
}

export async function updateClub(id: string, updates: Record<string, unknown>) {
  return request(`/data/clubs/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function deleteClub(id: string) {
  return request(`/data/clubs/${id}`, { method: 'DELETE' });
}

export async function fetchMyMemberships() {
  return request('/data/memberships/my');
}

export async function applyToClub(clubId: string) {
  return request('/data/memberships', { method: 'POST', body: JSON.stringify({ club_id: clubId }) });
}

export async function approveMembership(id: string, status: 'active' | 'rejected') {
  return request(`/data/memberships/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function fetchPendingApplications(clubId: string) {
  return request(`/data/clubs/${clubId}/pending`);
}

export async function fetchClubMembers(clubId: string) {
  return request(`/data/clubs/${clubId}/members`);
}

export async function fetchApprovals(uid?: string) {
  const qs = uid ? `?uid=${encodeURIComponent(uid)}` : '';
  return request(`/data/approvals${qs}`);
}

export async function createApproval(approval: Record<string, unknown>) {
  return request('/data/approvals', { method: 'POST', body: JSON.stringify(approval) });
}

export async function updateApproval(id: string, updates: Record<string, unknown>) {
  return request(`/data/approvals/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

export async function fetchUsers() {
  return request('/data/users');
}

export async function deleteUser(id: string) {
  return request(`/data/users/${id}`, { method: 'DELETE' });
}

// ── AI API ──

export async function askAI(prompt: string, context?: string) {
  const data = await request('/chat', {
    method: 'POST',
    body: JSON.stringify({ prompt, context }),
  });
  return data.reply;
}

export async function generateClubDescription(clubName: string, category: string) {
  const prompt = `Generate a compelling and professional description for a student club named '${clubName}' in the '${category}' category. Keep it under 100 words.`;
  return askAI(prompt);
}

export async function fetchModels() {
  const data = await request('/chat/models');
  return data.models;
}
