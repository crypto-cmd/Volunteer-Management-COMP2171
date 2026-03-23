import { readFileSync, writeFileSync } from "fs";
import { Event } from "@models";

interface RawEvent {
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

interface EventsData {
    events: RawEvent[];
}

export class EventRepository {
    private readonly eventsPath: string;

    constructor(eventsPath: string) {
        this.eventsPath = eventsPath;
    }

    private loadRaw(): EventsData {
        return JSON.parse(readFileSync(this.eventsPath, "utf-8"));
    }

    private save(data: EventsData): void {
        writeFileSync(this.eventsPath, JSON.stringify(data, null, 2));
    }

    findAll(): Event[] {
        const raw = this.loadRaw();
        return raw.events.map((e) =>
            new Event(
                e.id,
                e.name,
                e.description,
                e.date,
                e.time,
                e.location,
                e.capacity,
                e.category,
                e.status,
            )
        );
    }

    findById(eventId: string): Event | null {
        const raw = this.loadRaw();
        const found = raw.events.find((e) => e.id === eventId);
        if (!found) return null;

        return new Event(
            found.id,
            found.name,
            found.description,
            found.date,
            found.time,
            found.location,
            found.capacity,
            found.category,
            found.status,
        );
    }

    create(event: Event): void {
        const raw = this.loadRaw();

        if (raw.events.some((e) => e.id === event.id)) {
            throw new Error("Event already exists");
        }

        raw.events.push(event.toJSON());
        this.save(raw);
    }

    update(event: Event): void {
        const raw = this.loadRaw();

        const idx = raw.events.findIndex((e) => e.id === event.id);
        if (idx < 0) {
            throw new Error("Event not found");
        }

        raw.events[idx] = event.toJSON();
        this.save(raw);
    }

    delete(eventId: string): void {
        const raw = this.loadRaw();

        const idx = raw.events.findIndex((e) => e.id === eventId);
        if (idx < 0) {
            throw new Error("Event not found");
        }

        raw.events.splice(idx, 1);
        this.save(raw);
    }
}
