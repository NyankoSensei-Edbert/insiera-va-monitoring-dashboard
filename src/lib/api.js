// All requests go to /api/* — the proxy strips the prefix and
// forwards to the real backend (set via BACKEND_URL env var).

export async function apiFetch(path, options = {}, token = '') {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Seclabid': token } : {}),
      ...options.headers,
    }
    const res = await fetch('/api' + path, { ...options, headers })
    const data = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, data }
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e.message }
  }
}
