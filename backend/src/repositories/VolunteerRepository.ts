import { readFileSync, writeFileSync } from "fs";
import { EventRequest, type EventRequestStatus, Volunteer, TimesheetRecord } from "@models";

interface VolunteersData {
    volunteers: { id: string; name: string }[];
}

interface TimesheetsData {
    records: {
        [volunteerId: string]: {
            id: number;
            date: string;
            eventId?: string;
            eventName?: string;
            hoursWorked: number;
        }[];
    };
}

interface RequestsData {
    requests: {
        id: number;
        eventId: string;
        volunteerId: string;
        status: EventRequestStatus;
        requestedAt: string;
    }[];
}

interface EventsData {
    events: {
        id: string;
        name: string;
        description: string;
        date: string;
        time: string;
        location: string;
        capacity: number;
        category: string;
        status: string;
    }[];
}

export class VolunteerRepository {
    private readonly volunteersPath: string;
    private readonly timesheetsPath: string;
    private readonly eventsPath: string;
    private readonly requestsPath: string;

    constructor(volunteersPath: string, timesheetsPath: string, eventsPath: string, requestsPath: string) {
        this.volunteersPath = volunteersPath;
        this.timesheetsPath = timesheetsPath;
        this.eventsPath = eventsPath;
        this.requestsPath = requestsPath;
    }

    private loadVolunteers(): VolunteersData {
        return JSON.parse(readFileSync(this.volunteersPath, "utf-8"));
    }

    private loadTimesheets(): TimesheetsData {
        return JSON.parse(readFileSync(this.timesheetsPath, "utf-8"));
    }

    private saveTimesheets(data: TimesheetsData): void {
        writeFileSync(this.timesheetsPath, JSON.stringify(data, null, 2));
    }

    private loadRequests(): RequestsData {
        return JSON.parse(readFileSync(this.requestsPath, "utf-8"));
    }

    private saveRequests(data: RequestsData): void {
        writeFileSync(this.requestsPath, JSON.stringify(data, null, 2));
    }

    private loadEvents(): EventsData {
        return JSON.parse(readFileSync(this.eventsPath, "utf-8"));
    }

    private ensureRequests(data: RequestsData): RequestsData["requests"] {
        if (Array.isArray(data.requests)) return data.requests;
        data.requests = [];
        this.saveRequests(data);
        return data.requests;
    }

    private getNextTimesheetRecordId(data: TimesheetsData): number {
        const allRecords = Object.values(data.records).flat();
        if (allRecords.length === 0) return 1;
        return Math.max(...allRecords.map((r) => r.id)) + 1;
    }

    findAllVolunteers(): Volunteer[] {
        const volunteersData = this.loadVolunteers();
        return volunteersData.volunteers.map(v => new Volunteer(v.id, v.name));
    }

    findVolunteerById(id: string): Volunteer | null {
        const volunteersData = this.loadVolunteers();
        const found = volunteersData.volunteers.find(v => v.id === id);
        return found ? new Volunteer(found.id, found.name) : null;
    }

    getRecordsForVolunteer(volunteerId: string): TimesheetRecord[] {
        const timesheetsData = this.loadTimesheets();
        const eventsData = this.loadEvents();
        const entries = timesheetsData.records[volunteerId] || [];
        const eventNameById = new Map(eventsData.events.map(e => [e.id, e.name]));

        return entries.map(r => {
            const resolvedEventId = r.eventId || "";
            const resolvedEventName =
                (resolvedEventId && eventNameById.get(resolvedEventId)) || r.eventName || "Unknown Event";

            return new TimesheetRecord(
                r.id,
                r.date,
                resolvedEventId,
                resolvedEventName,
                r.hoursWorked,
            );
        });
    }

    updateRecord(volunteerId: string, recordId: number, hoursWorked: number): TimesheetRecord | null {
        const timesheetsData = this.loadTimesheets();
        const eventsData = this.loadEvents();
        const records = timesheetsData.records[volunteerId];
        if (!records) return null;

        const entry = records.find(r => r.id === recordId);
        if (!entry) return null;

        const eventNameById = new Map(eventsData.events.map(e => [e.id, e.name]));
        const resolvedEventId = entry.eventId || "";
        const resolvedEventName =
            (resolvedEventId && eventNameById.get(resolvedEventId)) || entry.eventName || "Unknown Event";

        const record = new TimesheetRecord(
            entry.id,
            entry.date,
            resolvedEventId,
            resolvedEventName,
            entry.hoursWorked,
        );
        record.updateHours(hoursWorked);

        entry.hoursWorked = record.hoursWorked;
        this.saveTimesheets(timesheetsData);

        return record;
    }

    getEventRequests(filters?: {
        eventId?: string;
        volunteerId?: string;
        status?: EventRequestStatus;
    }): EventRequest[] {
        const requestsData = this.loadRequests();
        const eventsData = this.loadEvents();
        const volunteersData = this.loadVolunteers();
        const requests = this.ensureRequests(requestsData);

        const eventNameById = new Map(eventsData.events.map(e => [e.id, e.name]));
        const volunteerNameById = new Map(volunteersData.volunteers.map(v => [v.id, v.name]));

        return requests
            .filter(r => (filters?.eventId ? r.eventId === filters.eventId : true))
            .filter(r => (filters?.volunteerId ? r.volunteerId === filters.volunteerId : true))
            .filter(r => (filters?.status ? r.status === filters.status : true))
            .map(r => new EventRequest(
                r.id,
                r.eventId,
                r.volunteerId,
                r.status,
                r.requestedAt,
                eventNameById.get(r.eventId),
                volunteerNameById.get(r.volunteerId),
            ));
    }

    createEventRequest(volunteerId: string, eventId: string): EventRequest {
        const requestsData = this.loadRequests();
        const requests = this.ensureRequests(requestsData);
        const eventsData = this.loadEvents();
        const volunteersData = this.loadVolunteers();

        const volunteer = volunteersData.volunteers.find(v => v.id === volunteerId);
        if (!volunteer) {
            throw new Error("Volunteer not found");
        }

        const event = eventsData.events.find(e => e.id === eventId);
        if (!event) {
            throw new Error("Event not found");
        }

        if (event.status !== "Published" && event.status !== "Ongoing") {
            throw new Error("Only published or ongoing events can accept requests");
        }

        const existingActive = requests.find(r =>
            r.eventId === eventId && r.volunteerId === volunteerId && (r.status === "Pending" || r.status === "Accepted")
        );
        if (existingActive) {
            throw new Error("A request already exists for this event");
        }

        const id = requests.length ? Math.max(...requests.map(r => r.id)) + 1 : 1;
        const requestedAt = new Date().toISOString();
        const entry = {
            id,
            eventId,
            volunteerId,
            status: "Pending" as EventRequestStatus,
            requestedAt,
        };

        requests.push(entry);
        this.saveRequests(requestsData);

        return new EventRequest(
            id,
            eventId,
            volunteerId,
            entry.status,
            requestedAt,
            event.name,
            volunteer.name,
        );
    }

    updateEventRequestStatus(requestId: number, status: EventRequestStatus): EventRequest | null {
        const requestsData = this.loadRequests();
        const requests = this.ensureRequests(requestsData);
        const timesheetsData = this.loadTimesheets();
        const eventsData = this.loadEvents();
        const volunteersData = this.loadVolunteers();

        const req = requests.find(r => r.id === requestId);
        if (!req) return null;

        const event = eventsData.events.find(e => e.id === req.eventId);
        if (!event) {
            throw new Error("Event not found for request");
        }

        if (status === "Accepted") {
            const acceptedCountExcludingCurrent = requests.filter(
                (r) => r.eventId === req.eventId && r.status === "Accepted" && r.id !== req.id,
            ).length;

            if (acceptedCountExcludingCurrent >= event.capacity) {
                throw new Error("Event is at capacity. Please update event capacity before accepting more volunteers.");
            }
        }

        const wasAccepted = req.status === "Accepted";
        req.status = status;
        this.saveRequests(requestsData);

        if (status === "Accepted" && !wasAccepted) {
            const volunteerRecords = timesheetsData.records[req.volunteerId] || [];
            const hasExistingRecordForEvent = volunteerRecords.some((r) => r.eventId === req.eventId);

            if (!hasExistingRecordForEvent) {
                const newRecord = {
                    id: this.getNextTimesheetRecordId(timesheetsData),
                    date: event.date,
                    eventId: event.id,
                    eventName: event.name,
                    hoursWorked: 0,
                };

                const targetRecords = timesheetsData.records[req.volunteerId] || (timesheetsData.records[req.volunteerId] = []);
                targetRecords.push(newRecord);
                this.saveTimesheets(timesheetsData);
            }
        }

        const eventName = eventsData.events.find(e => e.id === req.eventId)?.name;
        const volunteerName = volunteersData.volunteers.find(v => v.id === req.volunteerId)?.name;

        return new EventRequest(
            req.id,
            req.eventId,
            req.volunteerId,
            req.status,
            req.requestedAt,
            eventName,
            volunteerName,
        );
    }
}
