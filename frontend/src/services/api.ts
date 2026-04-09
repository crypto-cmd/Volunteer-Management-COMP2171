export const API_BASE = process.env.BUN_PUBLIC_API_BASE || "http://localhost:3001";

export async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, options);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload.error || "Request failed");
    }

    return payload as T;
}