export type HealthResponse = { ok: boolean; time: string };

const base = import.meta.env.VITE_API_BASE || '';

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(base + '/api/health', { credentials: 'include' });
  if (!res.ok) throw new Error(`Health request failed: ${res.status}`);
  return res.json();
}

export async function getNetworks(): Promise<{ networks: string[] }> {
  const res = await fetch(base + '/api/networks', { credentials: 'include' });
  if (!res.ok) throw new Error(`Networks request failed: ${res.status}`);
  return res.json();
}

export async function echo(body: any): Promise<any> {
  const res = await fetch(base + '/api/echo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include'
  });
  if (!res.ok) throw new Error(`Echo request failed: ${res.status}`);
  return res.json();
}
