import { VolunteerRepository } from "@repositories";
import { Volunteer, TimesheetRecord } from "@models";

export class VolunteerService {
    private readonly repo: VolunteerRepository;

    constructor(repo: VolunteerRepository) {
        this.repo = repo;
    }

    searchVolunteers(query: string): Volunteer[] {
        const all = this.repo.findAllVolunteers();
        const lowerQuery = query.toLowerCase();
        return lowerQuery ? all.filter(v => v.matchesFuzzy(lowerQuery)) : all;
    }

    getVolunteerRecords(volunteerId: string): { volunteer: Volunteer; records: TimesheetRecord[] } | null {
        const volunteer = this.repo.findVolunteerById(volunteerId);
        if (!volunteer) return null;
        const records = this.repo.getRecordsForVolunteer(volunteerId);
        return { volunteer, records };
    }

    updateRecord(volunteerId: string, recordId: number, hoursWorked: number): TimesheetRecord | null {
        return this.repo.updateRecord(volunteerId, recordId, hoursWorked);
    }
}
