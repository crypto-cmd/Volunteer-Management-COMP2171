import { getAuthHeaders } from "./AuthApiService";
import { requestJson } from "./api";

export interface AnnouncementRecord {
    id: number;
    title: string;
    message: string;
    postedAt: string;
    postedBy: string;
}

export class AnnouncementApiService {
    async getAnnouncements(): Promise<AnnouncementRecord[]> {
        return requestJson<AnnouncementRecord[]>("/api/announcements");
    }

    async createAnnouncement(title: string, message: string): Promise<AnnouncementRecord> {
        return requestJson<AnnouncementRecord>("/api/announcements", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ title, message }),
        });
    }
}
