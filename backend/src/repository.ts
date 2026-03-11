import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Volunteer, TimesheetRecord } from "./models";

interface RawData {
    volunteers: { id: string; name: string }[];
    records: { [volunteerId: string]: { id: number; date: string; eventName: string; hoursWorked: number }[] };
}

export class VolunteerRepository {
    private readonly dataPath: string;

    constructor(dataPath: string) {
        this.dataPath = dataPath;
    }

    private loadRaw(): RawData {
        return JSON.parse(readFileSync(this.dataPath, "utf-8"));
    }

    private save(data: RawData): void {
        writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    }

    findAllVolunteers(): Volunteer[] {
        const raw = this.loadRaw();
        return raw.volunteers.map(v => new Volunteer(v.id, v.name));
    }

    findVolunteerById(id: string): Volunteer | null {
        const raw = this.loadRaw();
        const found = raw.volunteers.find(v => v.id === id);
        return found ? new Volunteer(found.id, found.name) : null;
    }

    getRecordsForVolunteer(volunteerId: string): TimesheetRecord[] {
        const raw = this.loadRaw();
        const entries = raw.records[volunteerId] || [];
        return entries.map(r => new TimesheetRecord(r.id, r.date, r.eventName, r.hoursWorked));
    }

    updateRecord(volunteerId: string, recordId: number, hoursWorked: number): TimesheetRecord | null {
        const raw = this.loadRaw();
        const records = raw.records[volunteerId];
        if (!records) return null;

        const entry = records.find(r => r.id === recordId);
        if (!entry) return null;

        const record = new TimesheetRecord(entry.id, entry.date, entry.eventName, entry.hoursWorked);
        record.updateHours(hoursWorked);

        entry.hoursWorked = record.hoursWorked;
        this.save(raw);

        return record;
    }
}
