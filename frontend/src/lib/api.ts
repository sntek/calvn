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

export { API_BASE };
