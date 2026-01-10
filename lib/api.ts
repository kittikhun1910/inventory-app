export async function fetchJSON(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) throw json || new Error(res.statusText);
    return json;
  } catch (err) {
    // if not JSON throw text
    if (!res.ok) throw new Error(text || (err as Error).message);
    return text;
  }
}

export async function postJSON(url: string, body: any) {
  return fetchJSON(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

export async function putJSON(url: string, body: any) {
  return fetchJSON(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

export async function deleteJSON(url: string) {
  return fetchJSON(url, { method: 'DELETE' });
}

export async function postForm(url: string, form: FormData) {
  const res = await fetch(url, { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok) throw json || new Error(res.statusText);
  return json;
}