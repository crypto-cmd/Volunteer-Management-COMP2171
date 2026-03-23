import express from "express";
import { join } from "path";
import { type EventRequestStatus, Event } from "@models";
import { EventRepository, VolunteerRepository } from "./repositories";
import { ManageEventsService, VolunteerService } from "./services";

const VOLUNTEERS_DATA_PATH = join(import.meta.dir, "../data/volunteers.json");
const TIMESHEETS_DATA_PATH = join(import.meta.dir, "../data/timesheets.json");
const EVENTS_DATA_PATH = join(import.meta.dir, "../data/events.json");
const REQUESTS_DATA_PATH = join(import.meta.dir, "../data/requests.json");

const volunteerRepo = new VolunteerRepository(
    VOLUNTEERS_DATA_PATH,
    TIMESHEETS_DATA_PATH,
    EVENTS_DATA_PATH,
    REQUESTS_DATA_PATH,
);
const volunteerService = new VolunteerService(volunteerRepo);
const eventRepo = new EventRepository(EVENTS_DATA_PATH);
const eventService = new ManageEventsService(eventRepo);

const allowedOrigin = process.env.FRONTEND_PATH || "http://localhost:3000";

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", allowedOrigin);
    res.set("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Vary", "Origin");
    next();
});

// OPTIONS handler
app.options("*", (req, res) => {
    res.status(204).end();
});

// Root
app.get("/", (req, res) => {
    res.send("Volunteer Management API");
});

// Volunteers
app.get("/api/volunteers", (req, res) => {
    const query = (req.query.q as string) || "";
    const results = volunteerService.searchVolunteers(query);
    res.json(results);
});

app.get("/api/volunteers/:id/records", (req, res) => {
    const result = volunteerService.getVolunteerRecords(req.params.id);
    if (!result) {
        return res.status(404).json({ error: "Volunteer not found" });
    }
    res.json(result);
});

app.put("/api/volunteers/:id/records/:recordId", (req, res) => {
    const { id, recordId } = req.params;
    const body = req.body as { hoursWorked?: number };

    if (typeof body.hoursWorked !== "number" || body.hoursWorked < 0) {
        return res.status(400).json({ error: "Invalid hoursWorked value" });
    }

    try {
        const record = volunteerService.updateRecord(id, Number(recordId), body.hoursWorked);
        if (!record) {
            return res.status(404).json({ error: "Record not found" });
        }
        res.json(record);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Events
app.get("/api/events", (req, res) => {
    res.json(eventService.getAllEvents());
});

app.post("/api/events", (req, res) => {
    const body = req.body as {
        id?: string;
        name?: string;
        description?: string;
        date?: string;
        time?: string;
        location?: string;
        capacity?: number;
        category?: string;
        status?: string;
    };

    if (
        !body.id || !body.name || !body.description || !body.date || !body.time || !body.location ||
        typeof body.capacity !== "number" || !body.category || !body.status
    ) {
        return res.status(400).json({ error: "Invalid event payload" });
    }

    try {
        eventService.createEvent(
            body.id,
            body.name,
            body.description,
            body.date,
            body.time,
            body.location,
            body.capacity,
            body.category,
            body.status,
        );
        const created = eventService.getEvent(body.id);
        res.status(201).json(created);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

app.get("/api/events/:id", (req, res) => {
    const event = eventService.getEvent(req.params.id);
    if (!event) {
        return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
});

app.put("/api/events/:id", (req, res) => {
    const { id } = req.params;
    const body = req.body as {
        name?: string;
        description?: string;
        date?: string;
        time?: string;
        location?: string;
        capacity?: number;
        category?: string;
        status?: string;
    };

    const existing = eventService.getEvent(id);
    if (!existing) {
        return res.status(404).json({ error: "Event not found" });
    }

    const updated = new Event(
        id,
        body.name ?? existing.name,
        body.description ?? existing.description,
        body.date ?? existing.date,
        body.time ?? existing.time,
        body.location ?? existing.location,
        typeof body.capacity === "number" ? body.capacity : existing.capacity,
        body.category ?? existing.category,
        body.status ?? existing.status,
    );

    try {
        eventService.updateEvent(updated);
        res.json(updated);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

app.delete("/api/events/:id", (req, res) => {
    try {
        eventService.deleteEvent(req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Event requests
app.post("/api/events/:id/requests", (req, res) => {
    const { id: eventId } = req.params;
    const body = req.body as { volunteerId?: string };

    if (!body.volunteerId) {
        return res.status(400).json({ error: "volunteerId is required" });
    }

    try {
        const created = volunteerService.createEventRequest(body.volunteerId, eventId);
        res.status(201).json(created);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

app.get("/api/event-requests", (req, res) => {
    const status = req.query.status as EventRequestStatus | null;
    const eventId = (req.query.eventId as string) || undefined;
    const volunteerId = (req.query.volunteerId as string) || undefined;

    if (status && !["Pending", "Accepted", "Declined"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    res.json(volunteerService.getEventRequests({
        eventId,
        volunteerId,
        status: status || undefined,
    }));
});

app.put("/api/event-requests/:requestId", (req, res) => {
    const { requestId } = req.params;
    const body = req.body as { status?: EventRequestStatus };

    if (!body.status || !["Pending", "Accepted", "Declined"].includes(body.status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    try {
        const updated = volunteerService.updateEventRequestStatus(Number(requestId), body.status);
        if (!updated) {
            return res.status(404).json({ error: "Request not found" });
        }
        res.json(updated);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});

export default app;
