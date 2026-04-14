const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/api/status`);
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/api/settings`);
  return res.json();
}

export async function updateSettings(settings: Record<string, string>) {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  return res.json();
}

export async function fetchQueueStatus() {
  const res = await fetch(`${API_BASE}/api/analytics/queue`);
  return res.json();
}

export async function fetchSkills() {
  const res = await fetch(`${API_BASE}/api/skills`);
  return res.json();
}

export async function fetchSkill(name: string) {
  const res = await fetch(`${API_BASE}/api/skills/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`Failed to fetch skill: ${res.statusText}`);
  return res.json();
}

export async function createSkill(data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create skill: ${res.statusText}`);
  return res.json();
}

export async function updateSkill(name: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/skills/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update skill: ${res.statusText}`);
  return res.json();
}

export async function deleteSkill(name: string) {
  const res = await fetch(`${API_BASE}/api/skills/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete skill: ${res.statusText}`);
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export { API_BASE };
