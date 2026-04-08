import { API_BASE } from "./api";
import { getAuthHeaders } from "./AuthApiService";

export interface AnnouncementRecord {
    id: number;
    title: string;
    message: string;
    postedAt: string;
    postedBy: string;
}

export class AnnouncementApiService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE;
    }

    async getAnnouncements(): Promise<AnnouncementRecord[]> {
        const res = await fetch(`${this.baseUrl}/api/announcements`);
        if (!res.ok) throw new Error("Failed to fetch announcements");
        return res.json();
    }

    async createAnnouncement(title: string, message: string): Promise<AnnouncementRecord> {
        const res = await fetch(`${this.baseUrl}/api/announcements`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ title, message }),
        });

        if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            throw new Error(payload.error || "Failed to create announcement");
        }

        return res.json();
    }
}
