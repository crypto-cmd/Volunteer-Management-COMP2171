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

const corsHeaders = {
  "Access-Control-Allow-Origin": `http://localhost:${process.env.FRONTEND_PORT || 3000}`,
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

const server = Bun.serve({
  port: process.env.BACKEND_PORT || 8080,
  routes: {
    "/": () => new Response("Volunteer Management API"),

    "/api/volunteers": {
      async GET(req) {
        const url = new URL(req.url);
        const query = url.searchParams.get("q") || "";
        const results = volunteerService.searchVolunteers(query);
        return json(results);
      },
    },

    "/api/volunteers/:id/records": {
      async GET(req) {
        const { id } = req.params;
        const result = volunteerService.getVolunteerRecords(id);
        if (!result) return json({ error: "Volunteer not found" }, 404);
        return json(result);
      },
    },

    "/api/volunteers/:id/records/:recordId": {
      async PUT(req) {
        const { id, recordId } = req.params;
        const body = await req.json() as { hoursWorked?: number };

        if (typeof body.hoursWorked !== "number" || body.hoursWorked < 0) {
          return json({ error: "Invalid hoursWorked value" }, 400);
        }

        try {
          const record = volunteerService.updateRecord(id, Number(recordId), body.hoursWorked);
          if (!record) return json({ error: "Record not found" }, 404);
          return json(record);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },

    "/api/events": {
      async GET() {
        return json(eventService.getAllEvents());
      },
      async POST(req) {
        const body = await req.json() as {
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
          return json({ error: "Invalid event payload" }, 400);
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
          return json(created, 201);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },

    "/api/events/:id": {
      async GET(req) {
        const event = eventService.getEvent(req.params.id);
        if (!event) return json({ error: "Event not found" }, 404);
        return json(event);
      },
      async PUT(req) {
        const { id } = req.params;
        const body = await req.json() as {
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
        if (!existing) return json({ error: "Event not found" }, 404);

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
          return json(updated);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
      async DELETE(req) {
        try {
          eventService.deleteEvent(req.params.id);
          return json({ success: true });
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },

    "/api/events/:id/requests": {
      async POST(req) {
        const { id: eventId } = req.params;
        const body = await req.json() as { volunteerId?: string };

        if (!body.volunteerId) {
          return json({ error: "volunteerId is required" }, 400);
        }

        try {
          const created = volunteerService.createEventRequest(body.volunteerId, eventId);
          return json(created, 201);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },

    "/api/event-requests": {
      async GET(req) {
        const url = new URL(req.url);
        const status = url.searchParams.get("status") as EventRequestStatus | null;
        const eventId = url.searchParams.get("eventId") || undefined;
        const volunteerId = url.searchParams.get("volunteerId") || undefined;

        if (status && !["Pending", "Accepted", "Declined"].includes(status)) {
          return json({ error: "Invalid status" }, 400);
        }

        return json(volunteerService.getEventRequests({
          eventId,
          volunteerId,
          status: status || undefined,
        }));
      },
    },

    "/api/event-requests/:requestId": {
      async PUT(req) {
        const { requestId } = req.params;
        const body = await req.json() as { status?: EventRequestStatus };

        if (!body.status || !["Pending", "Accepted", "Declined"].includes(body.status)) {
          return json({ error: "Invalid status" }, 400);
        }

        try {
          const updated = volunteerService.updateEventRequestStatus(Number(requestId), body.status);
          if (!updated) return json({ error: "Request not found" }, 404);

          return json(updated);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },
  },
  fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
});

console.log(`Listening on ${server.url}`);