export type StayKind = "hotel" | "apartment" | "hostel" | "bnb" | "camping" | "other";
export type StaySource = "assisted" | "link" | "manual" | "agent";

export interface Stay {
  id: number;
  name: string;
  location: string;
  kind: StayKind;
  url: string | null;
  price_per_night: number | string | null;
  currency: string | null;
  rating: number | null;
  notes: string | null;
  source: StaySource;
}

export interface StayCreate {
  name: string;
  location: string;
  kind: StayKind;
  url?: string | null;
  price_per_night?: number | null;
  currency?: string | null;
  rating?: number | null;
  notes?: string | null;
  source?: StaySource;
}

export type StayUpdate = Partial<StayCreate>;
export interface StayFilters { location?: string; kind?: StayKind; }

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError("Non è possibile raggiungere il servizio. Riprova tra poco.");
  }
  if (!response.ok) {
    let message = "La richiesta non è stata completata.";
    try {
      const body = await response.json() as { detail?: string; error?: { message?: string } };
      message = body.error?.message ?? body.detail ?? message;
    } catch { /* risposta senza corpo leggibile */ }
    throw new ApiError(message, response.status);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export function listStays(filters: StayFilters = {}) {
  const query = new URLSearchParams();
  if (filters.location) query.set("location", filters.location);
  if (filters.kind) query.set("kind", filters.kind);
  const suffix = query.size ? `?${query}` : "";
  return request<Stay[]>(`/api/stays${suffix}`);
}
export function createStay(payload: StayCreate) {
  return request<Stay>("/api/stays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}
export function updateStay(id: number, payload: StayUpdate) {
  return request<Stay>(`/api/stays/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}
export function deleteStay(id: number) { return request<void>(`/api/stays/${id}`, { method: "DELETE" }); }
