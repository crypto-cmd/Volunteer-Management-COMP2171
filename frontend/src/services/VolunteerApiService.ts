export interface Volunteer {
    id: string;
    name: string;
}

export interface TimesheetRecord {
    id: number;
    date: string;
    eventName: string;
    hoursWorked: number;
}

export interface VolunteerRecordsResponse {
    volunteer: Volunteer;
    records: TimesheetRecord[];
}

const API_BASE = `http://localhost:${process.env.BUN_PUBLIC_BACKEND_PORT || 3001}`;

export class VolunteerApiService {
    private readonly baseUrl: string;

    constructor(baseUrl: string = API_BASE) {
        this.baseUrl = baseUrl;
    }

    async searchVolunteers(query: string, signal?: AbortSignal): Promise<Volunteer[]> {
        const res = await fetch(
            `${this.baseUrl}/api/volunteers?q=${encodeURIComponent(query)}`,
            { signal }
        );
        if (!res.ok) throw new Error("Failed to search volunteers");
        return res.json();
    }

    async getVolunteerRecords(volunteerId: string): Promise<VolunteerRecordsResponse> {
        const res = await fetch(
            `${this.baseUrl}/api/volunteers/${encodeURIComponent(volunteerId)}/records`
        );
        if (!res.ok) throw new Error("Failed to fetch records");
        return res.json();
    }

    async updateRecord(volunteerId: string, recordId: number, hoursWorked: number): Promise<TimesheetRecord> {
        const res = await fetch(
            `${this.baseUrl}/api/volunteers/${encodeURIComponent(volunteerId)}/records/${recordId}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hoursWorked }),
            }
        );
        if (!res.ok) throw new Error("Failed to update record");
        return res.json();
    }
}
