import { API_BASE } from "./api";
import { getAuthHeaders } from "./AuthApiService";

export interface BadgeRecord {
    id: number;
    name: string;
    description: string;
    icon: string;
    createdAt: string;
}

export interface VolunteerBadgeRecord {
    id: number;
    volunteerId: string;
    badgeId: number;
    awardedAt: string;
    badgeName?: string;
    badgeDescription?: string;
    badgeIcon?: string;
}

export class BadgeApiService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE;
    }

    async getBadges(): Promise<BadgeRecord[]> {
        const res = await fetch(`${this.baseUrl}/api/badges`);
        if (!res.ok) throw new Error("Failed to fetch badges");
        return res.json();
    }

    async createBadge(name: string, description: string, icon: string): Promise<BadgeRecord> {
        const res = await fetch(`${this.baseUrl}/api/badges`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ name, description, icon }),
        });

        if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            throw new Error(payload.error || "Failed to create badge");
        }

        return res.json();
    }

    async getVolunteerBadges(volunteerId: string): Promise<VolunteerBadgeRecord[]> {
        const res = await fetch(`${this.baseUrl}/api/volunteers/${encodeURIComponent(volunteerId)}/badges`);
        if (!res.ok) throw new Error("Failed to fetch volunteer badges");
        return res.json();
    }

    async assignBadge(volunteerId: string, badgeId: number): Promise<VolunteerBadgeRecord> {
        const res = await fetch(`${this.baseUrl}/api/volunteers/${encodeURIComponent(volunteerId)}/badges`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ badgeId }),
        });

        if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            throw new Error(payload.error || "Failed to assign badge");
        }

        return res.json();
    }
}
