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

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin",
};

function sendJson(res: any, body: unknown, status = 200) {
  res.statusCode = status;
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function sendText(res: any, body: string, status = 200) {
  res.statusCode = status;
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(body);
}

async function readJsonBody(req: any): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    return null;
  }
}

function matchPath(pattern: string, pathname: string) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      continue;
    }

    if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}

export default async function handler(req: any, res: any) {
  const url = new URL(req.url || "/", "http://localhost");
  const pathname = url.pathname;
  const method = req.method || "GET";

  if (method === "OPTIONS") {
    res.statusCode = 204;
    for (const [key, value] of Object.entries(corsHeaders)) {
      res.setHeader(key, value);
    }
    res.end();
    return;
  }

  if (method === "GET" && pathname === "/") {
    sendText(res, "Volunteer Management API");
    return;
  }

  if (method === "GET" && pathname === "/api/volunteers") {
    const query = url.searchParams.get("q") || "";
    sendJson(res, volunteerService.searchVolunteers(query));
    return;
  }

  let params = matchPath("/api/volunteers/:id/records", pathname);
  if (method === "GET" && params) {
    const result = volunteerService.getVolunteerRecords(params.id);
    if (!result) {
      sendJson(res, { error: "Volunteer not found" }, 404);
      return;
    }
    sendJson(res, result);
    return;
  }

  params = matchPath("/api/volunteers/:id/records/:recordId", pathname);
  if (method === "PUT" && params) {
    const body = await readJsonBody(req);
    if (!body || typeof body.hoursWorked !== "number" || body.hoursWorked < 0) {
      sendJson(res, { error: "Invalid hoursWorked value" }, 400);
      return;
    }

    try {
      const record = volunteerService.updateRecord(params.id, Number(params.recordId), body.hoursWorked);
      if (!record) {
        sendJson(res, { error: "Record not found" }, 404);
        return;
      }
      sendJson(res, record);
    } catch (e: any) {
      sendJson(res, { error: e.message }, 400);
    }
    return;
  }

  if (pathname === "/api/events" && method === "GET") {
    sendJson(res, eventService.getAllEvents());
    return;
  }

  if (pathname === "/api/events" && method === "POST") {
    const body = await readJsonBody(req);

    if (
      !body || !body.id || !body.name || !body.description || !body.date || !body.time || !body.location ||
      typeof body.capacity !== "number" || !body.category || !body.status
    ) {
      sendJson(res, { error: "Invalid event payload" }, 400);
      return;
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
      sendJson(res, created, 201);
    } catch (e: any) {
      sendJson(res, { error: e.message }, 400);
    }
    return;
  }

  params = matchPath("/api/events/:id", pathname);
  if (params && method === "GET") {
    const event = eventService.getEvent(params.id);
    if (!event) {
      sendJson(res, { error: "Event not found" }, 404);
      return;
    }
    sendJson(res, event);
    return;
  }

  if (params && method === "PUT") {
    const body = await readJsonBody(req);
    const existing = eventService.getEvent(params.id);

    if (!existing) {
      sendJson(res, { error: "Event not found" }, 404);
      return;
    }

    const updated = new Event(
      params.id,
      body?.name ?? existing.name,
      body?.description ?? existing.description,
      body?.date ?? existing.date,
      body?.time ?? existing.time,
      body?.location ?? existing.location,
      typeof body?.capacity === "number" ? body.capacity : existing.capacity,
      body?.category ?? existing.category,
      body?.status ?? existing.status,
    );

    try {
      eventService.updateEvent(updated);
      sendJson(res, updated);
    } catch (e: any) {
      sendJson(res, { error: e.message }, 400);
    }
    return;
  }

  if (params && method === "DELETE") {
    try {
      eventService.deleteEvent(params.id);
      sendJson(res, { success: true });
    } catch (e: any) {
      sendJson(res, { error: e.message }, 400);
    }
    return;
  }

  params = matchPath("/api/events/:id/requests", pathname);
  if (params && method === "POST") {
    const body = await readJsonBody(req);
    if (!body || !body.volunteerId) {
      sendJson(res, { error: "volunteerId is required" }, 400);
      return;
    }

    try {
      const created = volunteerService.createEventRequest(body.volunteerId, params.id);
      sendJson(res, created, 201);
    } catch (e: any) {
      sendJson(res, { error: e.message }, 400);
    }
    return;
  }

  if (pathname === "/api/event-requests" && method === "GET") {
    const status = url.searchParams.get("status") as EventRequestStatus | null;
    const eventId = url.searchParams.get("eventId") || undefined;
    const volunteerId = url.searchParams.get("volunteerId") || undefined;

    if (status && !["Pending", "Accepted", "Declined"].includes(status)) {
      sendJson(res, { error: "Invalid status" }, 400);
      return;
    }

    sendJson(res, volunteerService.getEventRequests({
      eventId,
      volunteerId,
      status: status || undefined,
    }));
    return;
  }

  params = matchPath("/api/event-requests/:requestId", pathname);
  if (params && method === "PUT") {
    const body = await readJsonBody(req);
    if (!body || !body.status || !["Pending", "Accepted", "Declined"].includes(body.status)) {
      sendJson(res, { error: "Invalid status" }, 400);
      return;
    }

    try {
      const updated = volunteerService.updateEventRequestStatus(Number(params.requestId), body.status);
      if (!updated) {
        sendJson(res, { error: "Request not found" }, 404);
        return;
      }
      sendJson(res, updated);
    } catch (e: any) {
      sendJson(res, { error: e.message }, 400);
    }
    return;
  }

  sendJson(res, { error: "Not Found" }, 404);
}
