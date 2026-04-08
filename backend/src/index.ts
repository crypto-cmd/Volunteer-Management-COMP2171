import {
  AnnouncementRepository,
  BadgeRepository,
  EventRepository,
  EventRequestRepository,
  VolunteerRepository,
} from "./repositories";
import {
  AnnouncementService,
  BadgeService,
  EventRequestService,
  ManageEventsService,
  VolunteerService,
} from "./services";
import { buildRoutes } from "./routes";
import type { RouteContext } from "./routes/types";

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
const eventRequestRepo = new EventRequestRepository(supabase);
const announcementRepo = new AnnouncementRepository(supabase);
const badgeRepo = new BadgeRepository(supabase);
const volunteerService = new VolunteerService(volunteerRepo);
const eventRequestService = new EventRequestService(eventRequestRepo);
const announcementService = new AnnouncementService(announcementRepo);
const badgeService = new BadgeService(badgeRepo);
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
  routes: buildRoutes({
    volunteerService,
    eventService,
    eventRequestService,
    announcementService,
    badgeService,
    isValidStudentId,
    json,
    requireAdmin,
  } satisfies RouteContext),
  fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
});

console.log(`Listening on ${server.url}`);