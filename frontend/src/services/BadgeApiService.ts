import { getAuthHeaders } from "./AuthApiService";
import { requestJson } from "./api";

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
    async getBadges(): Promise<BadgeRecord[]> {
        return requestJson<BadgeRecord[]>("/api/badges");
    }

    async createBadge(name: string, description: string, icon: string): Promise<BadgeRecord> {
        return requestJson<BadgeRecord>("/api/badges", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ name, description, icon }),
        });
    }

    async getVolunteerBadges(volunteerId: string): Promise<VolunteerBadgeRecord[]> {
        return requestJson<VolunteerBadgeRecord[]>(`/api/volunteers/${encodeURIComponent(volunteerId)}/badges`);
    }

    async assignBadge(volunteerId: string, badgeId: number): Promise<VolunteerBadgeRecord> {
        return requestJson<VolunteerBadgeRecord>(`/api/volunteers/${encodeURIComponent(volunteerId)}/badges`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ badgeId }),
        });
    }
}
