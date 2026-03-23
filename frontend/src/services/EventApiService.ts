export interface EventRecord {
    id: string;
    name: string;
    description: string;
    date: string;
    time: string;
    location: string;
    capacity: number;
    category: string;
    status: string;
}

export type EventPayload = Omit<EventRecord, "id">;

export type EventRequestStatus = "Pending" | "Accepted" | "Declined";

export interface EventRequestRecord {
    id: number;
    eventId: string;
    volunteerId: string;
    status: EventRequestStatus;
    requestedAt: string;
    eventName?: string;
    volunteerName?: string;
}

const env = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {});
const API_BASE = env.BUN_PUBLIC_BACKEND_URL || `http://localhost:${env.BUN_PUBLIC_BACKEND_PORT || 3001}`;

export class EventApiService {
    private readonly baseUrl: string;

    constructor(baseUrl: string = API_BASE) {
        this.baseUrl = baseUrl;
    }

    async getEvents(): Promise<EventRecord[]> {
        const res = await fetch(`${this.baseUrl}/api/events`);
        if (!res.ok) throw new Error("Failed to fetch events");
        return res.json();
    }

    async createEvent(payload: EventRecord): Promise<EventRecord> {
        const res = await fetch(`${this.baseUrl}/api/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create event");
        return res.json();
    }

    async updateEvent(eventId: string, payload: EventPayload): Promise<EventRecord> {
        const res = await fetch(`${this.baseUrl}/api/events/${encodeURIComponent(eventId)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update event");
        return res.json();
    }

    async deleteEvent(eventId: string): Promise<void> {
        const res = await fetch(`${this.baseUrl}/api/events/${encodeURIComponent(eventId)}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete event");
    }

    async requestEventParticipation(eventId: string, volunteerId: string): Promise<EventRequestRecord> {
        const res = await fetch(`${this.baseUrl}/api/events/${encodeURIComponent(eventId)}/requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ volunteerId }),
        });
        if (!res.ok) throw new Error("Failed to request participation");
        return res.json();
    }

    async getEventRequests(filters?: {
        eventId?: string;
        volunteerId?: string;
        status?: EventRequestStatus;
    }): Promise<EventRequestRecord[]> {
        const params = new URLSearchParams();
        if (filters?.eventId) params.set("eventId", filters.eventId);
        if (filters?.volunteerId) params.set("volunteerId", filters.volunteerId);
        if (filters?.status) params.set("status", filters.status);

        const query = params.toString();
        const res = await fetch(`${this.baseUrl}/api/event-requests${query ? `?${query}` : ""}`);
        if (!res.ok) throw new Error("Failed to fetch event requests");
        return res.json();
    }

    async updateEventRequestStatus(requestId: number, status: EventRequestStatus): Promise<EventRequestRecord> {
        const res = await fetch(`${this.baseUrl}/api/event-requests/${requestId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            throw new Error(payload.error || "Failed to update request status");
        }
        return res.json();
    }
}
