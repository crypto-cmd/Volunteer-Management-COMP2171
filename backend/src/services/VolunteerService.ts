import { VolunteerRepository } from "@repositories";
import { type EventRequestStatus, Volunteer, TimesheetRecord } from "@models";

export class VolunteerService {
    private readonly repo: VolunteerRepository;

    constructor(repo: VolunteerRepository) {
        this.repo = repo;
    }

    async searchVolunteers(query: string): Promise<Volunteer[]> {
        const all = await this.repo.findAllVolunteers();
        const lowerQuery = query.toLowerCase();
        return lowerQuery ? all.filter(v => v.matchesFuzzy(lowerQuery)) : all;
    }

    async getVolunteerRecords(volunteerId: string): Promise<{ volunteer: Volunteer; records: TimesheetRecord[] } | null> {
        const volunteer = await this.repo.findVolunteerById(volunteerId);
        if (!volunteer) return null;
        const records = await this.repo.getRecordsForVolunteer(volunteerId);
        return { volunteer, records };
    }

    async updateRecord(volunteerId: string, recordId: number, hoursWorked: number): Promise<TimesheetRecord | null> {
        return this.repo.updateRecord(volunteerId, recordId, hoursWorked);
    }

    async getEventRequests(filters?: { eventId?: string; volunteerId?: string; status?: EventRequestStatus }) {
        return this.repo.getEventRequests(filters);
    }

    async createEventRequest(volunteerId: string, eventId: string) {
        return this.repo.createEventRequest(volunteerId, eventId);
    }

    async updateEventRequestStatus(requestId: number, status: EventRequestStatus) {
        return this.repo.updateEventRequestStatus(requestId, status);
    }
}
