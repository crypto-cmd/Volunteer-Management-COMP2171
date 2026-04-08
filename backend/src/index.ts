import { type EventRequestStatus, Event } from "@models";
import { EventRepository, VolunteerRepository } from "./repositories";
import { ManageEventsService, VolunteerService } from "./services";

import { createClient } from '@supabase/supabase-js';

// 1. Grab environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_KEY must be set in the .env file.");
  process.exit(1);
}

// 2. Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

const volunteerRepo = new VolunteerRepository(supabase);
const volunteerService = new VolunteerService(volunteerRepo);
const eventRepo = new EventRepository(supabase);
const eventService = new ManageEventsService(eventRepo);

const corsHeaders = {
  "Access-Control-Allow-Origin": `*`,
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-student-id, x-user-role, Authorization",
};

const STUDENT_ID_REGEX = /^620\d{6}$/;

function isValidStudentId(value: string): boolean {
  return STUDENT_ID_REGEX.test(value);
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

async function requireAdmin(req: Request): Promise<Response | null> {
  const studentId = req.headers.get("x-student-id")?.trim() || "";
  const role = req.headers.get("x-user-role")?.trim() || "";

  if (!studentId || !isValidStudentId(studentId)) {
    return json({ error: "Missing or invalid admin identity" }, 401);
  }

  if (role !== "Admin") {
    return json({ error: "Admin access required" }, 403);
  }

  const isAdmin = await volunteerService.isAdmin(studentId);
  if (!isAdmin) {
    return json({ error: "Admin access denied" }, 403);
  }

  return null;
}

const server = Bun.serve({
  port: process.env.BACKEND_PORT || 8080,
  routes: {
    "/": () => new Response("Volunteer Management API"),

    "/api/auth/login": {
      async POST(req) {
        const body = await req.json() as { studentId?: string; password?: string };
        const studentId = body.studentId?.trim() || "";

        if (!studentId || !body.password) {
          return json({ error: "studentId and password are required" }, 400);
        }

        if (!isValidStudentId(studentId)) {
          return json({ error: "studentId must follow 620XXXXXX format" }, 400);
        }

        try {
          const user = await volunteerService.login(studentId, body.password);
          if (!user) return json({ error: "Invalid credentials" }, 401);
          return json(user);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },

    "/api/auth/register": {
      async POST(req) {
        const body = await req.json() as {
          studentId?: string;
          name?: string;
          password?: string;
          email?: string;
          phone?: string;
          major?: string;
          yearOfStudy?: string;
        };

        const studentId = body.studentId?.trim() || "";
        const name = body.name?.trim() || "";
        const password = body.password || "";

        if (!studentId || !name || !password) {
          return json({ error: "studentId, name and password are required" }, 400);
        }

        if (!isValidStudentId(studentId)) {
          return json({ error: "studentId must follow 620XXXXXX format" }, 400);
        }

        if (password.length < 6) {
          return json({ error: "Password must be at least 6 characters" }, 400);
        }

        try {
          const created = await volunteerService.registerVolunteer({
            studentId,
            name,
            password,
            email: body.email?.trim(),
            phone: body.phone?.trim(),
            major: body.major?.trim(),
            yearOfStudy: body.yearOfStudy?.trim(),
            role: "volunteer",
          });
          return json(created, 201);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },

    "/api/profile/:studentId": {
      async GET(req) {
        const { studentId } = req.params;

        if (!isValidStudentId(studentId)) {
          return json({ error: "studentId must follow 620XXXXXX format" }, 400);
        }

        try {
          const profile = await volunteerService.getUserProfile(studentId);
          if (!profile) return json({ error: "User not found" }, 404);
          return json(profile);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
      async PUT(req) {
        const { studentId } = req.params;

        if (!isValidStudentId(studentId)) {
          return json({ error: "studentId must follow 620XXXXXX format" }, 400);
        }

        const body = await req.json() as {
          name?: string;
          email?: string;
          phone?: string;
          major?: string;
          yearOfStudy?: string;
        };

        const hasAnyUpdate = [
          body.name,
          body.email,
          body.phone,
          body.major,
          body.yearOfStudy,
        ].some((value) => value !== undefined);

        if (!hasAnyUpdate) {
          return json({ error: "No profile fields supplied" }, 400);
        }

        try {
          const updated = await volunteerService.updateUserProfile(studentId, body);
          if (!updated) return json({ error: "User not found" }, 404);
          return json(updated);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },

    "/api/volunteers": {
      async GET(req) {
        const url = new URL(req.url);
        const query = url.searchParams.get("q") || "";
        const results = await volunteerService.searchVolunteers(query);
        return json(results);
      },
    },

    "/api/volunteers/:id/records": {
      async GET(req) {
        const { id } = req.params;

        if (!isValidStudentId(id)) {
          return json({ error: "Volunteer ID must follow 620XXXXXX format" }, 400);
        }

        const result = await volunteerService.getVolunteerRecords(id);
        if (!result) return json({ error: "Volunteer not found" }, 404);
        return json(result);
      },
    },

    "/api/volunteers/:id/records/:recordId": {
      async PUT(req) {
        const denied = await requireAdmin(req);
        if (denied) return denied;

        const { id, recordId } = req.params;

        if (!isValidStudentId(id)) {
          return json({ error: "Volunteer ID must follow 620XXXXXX format" }, 400);
        }

        const body = await req.json() as { hoursWorked?: number };

        if (typeof body.hoursWorked !== "number" || body.hoursWorked < 0) {
          return json({ error: "Invalid hoursWorked value" }, 400);
        }

        try {
          const record = await volunteerService.updateRecord(id, Number(recordId), body.hoursWorked);
          if (!record) return json({ error: "Record not found" }, 404);
          return json(record);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },

    "/api/events": {
      async GET() {
        return json(await eventService.getAllEvents());
      },
      async POST(req) {
        const denied = await requireAdmin(req);
        if (denied) return denied;

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

        if (
          !body.name || !body.description || !body.date || !body.time || !body.location ||
          typeof body.capacity !== "number" || !body.category || !body.status
        ) {
          return json({ error: "Invalid event payload" }, 400);
        }

        try {
          const created = await eventService.createEvent(
            body.name,
            body.description,
            body.date,
            body.time,
            body.location,
            body.capacity,
            body.category,
            body.status,
          );
          return json(created, 201);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },

    "/api/events/:id": {
      async GET(req) {
        const event = await eventService.getEvent(req.params.id);
        if (!event) return json({ error: "Event not found" }, 404);
        return json(event);
      },
      async PUT(req) {
        const denied = await requireAdmin(req);
        if (denied) return denied;

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

        const existing = await eventService.getEvent(id);
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
          await eventService.updateEvent(updated);
          return json(updated);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
      async DELETE(req) {
        const denied = await requireAdmin(req);
        if (denied) return denied;

        try {
          await eventService.deleteEvent(req.params.id);
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
        const volunteerId = body.volunteerId?.trim() || "";

        if (!volunteerId) {
          return json({ error: "volunteerId is required" }, 400);
        }

        if (!isValidStudentId(volunteerId)) {
          return json({ error: "volunteerId must follow 620XXXXXX format" }, 400);
        }

        try {
          const created = await volunteerService.createEventRequest(volunteerId, eventId);
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

        if (volunteerId && !isValidStudentId(volunteerId)) {
          return json({ error: "volunteerId must follow 620XXXXXX format" }, 400);
        }

        return json(await volunteerService.getEventRequests({
          eventId,
          volunteerId,
          status: status || undefined,
        }));
      },
    },

    "/api/event-requests/:requestId": {
      async PUT(req) {
        const denied = await requireAdmin(req);
        if (denied) return denied;

        const { requestId } = req.params;
        const body = await req.json() as { status?: EventRequestStatus };

        if (!body.status || !["Pending", "Accepted", "Declined"].includes(body.status)) {
          return json({ error: "Invalid status" }, 400);
        }

        try {
          const updated = await volunteerService.updateEventRequestStatus(Number(requestId), body.status);
          if (!updated) return json({ error: "Request not found" }, 404);

          return json(updated);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },

    "/api/announcements": {
      async GET() {
        return json(await volunteerService.getAnnouncements());
      },
      async POST(req) {
        const denied = await requireAdmin(req);
        if (denied) return denied;

        const studentId = req.headers.get("x-student-id")?.trim() || "";
        const body = await req.json() as { title?: string; message?: string };

        if (!body.title || !body.message) {
          return json({ error: "title and message are required" }, 400);
        }

        try {
          const created = await volunteerService.createAnnouncement(
            body.title.trim(),
            body.message.trim(),
            studentId,
          );

          return json(created, 201);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },

    "/api/badges": {
      async GET() {
        return json(await volunteerService.getBadges());
      },
      async POST(req) {
        const denied = await requireAdmin(req);
        if (denied) return denied;

        const body = await req.json() as { name?: string; description?: string; icon?: string };

        if (!body.name || !body.description) {
          return json({ error: "name and description are required" }, 400);
        }

        try {
          const created = await volunteerService.createBadge(
            body.name.trim(),
            body.description.trim(),
            body.icon?.trim() || "🏅",
          );
          return json(created, 201);
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
    },

    "/api/volunteers/:id/badges": {
      async GET(req) {
        const { id } = req.params;
        if (!isValidStudentId(id)) {
          return json({ error: "Volunteer ID must follow 620XXXXXX format" }, 400);
        }

        try {
          return json(await volunteerService.getVolunteerBadges(id));
        } catch (e: any) {
          return json({ error: e.message }, 400);
        }
      },
      async POST(req) {
        const denied = await requireAdmin(req);
        if (denied) return denied;

        const { id } = req.params;
        if (!isValidStudentId(id)) {
          return json({ error: "Volunteer ID must follow 620XXXXXX format" }, 400);
        }

        const body = await req.json() as { badgeId?: number };
        if (typeof body.badgeId !== "number") {
          return json({ error: "badgeId is required" }, 400);
        }

        try {
          const created = await volunteerService.assignBadge(id, body.badgeId);
          return json(created, 201);
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