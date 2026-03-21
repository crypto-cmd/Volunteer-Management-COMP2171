import { join } from "path";
import { VolunteerRepository } from "./repositories";
import { VolunteerService } from "./services";

const DATA_PATH = join(import.meta.dir, "../data/volunteers.json");
const repo = new VolunteerRepository(DATA_PATH);
const service = new VolunteerService(repo);

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
        const results = service.searchVolunteers(query);
        return json(results);
      },
    },

    "/api/volunteers/:id/records": {
      async GET(req) {
        const { id } = req.params;
        const result = service.getVolunteerRecords(id);
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
          const record = service.updateRecord(id, Number(recordId), body.hoursWorked);
          if (!record) return json({ error: "Record not found" }, 404);
          return json(record);
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