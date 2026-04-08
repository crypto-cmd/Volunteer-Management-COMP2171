import type { RouteContext, RouteMap } from "./types";

export function createVolunteerRoutes(ctx: RouteContext): RouteMap {
    return {
        "/api/profile/:studentId": {
            async GET(req: any) {
                const { studentId } = req.params;

                if (!ctx.isValidStudentId(studentId)) {
                    return ctx.json({ error: "studentId must follow 620XXXXXX format" }, 400);
                }

                try {
                    const profile = await ctx.volunteerService.getUserProfile(studentId);
                    if (!profile) return ctx.json({ error: "User not found" }, 404);
                    return ctx.json(profile);
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
            async PUT(req: any) {
                const { studentId } = req.params;

                if (!ctx.isValidStudentId(studentId)) {
                    return ctx.json({ error: "studentId must follow 620XXXXXX format" }, 400);
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
                    return ctx.json({ error: "No profile fields supplied" }, 400);
                }

                try {
                    const updated = await ctx.volunteerService.updateUserProfile(studentId, body);
                    if (!updated) return ctx.json({ error: "User not found" }, 404);
                    return ctx.json(updated);
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
        },

        "/api/volunteers": {
            async GET(req: Request) {
                const url = new URL(req.url);
                const query = url.searchParams.get("q") || "";
                const results = await ctx.volunteerService.searchVolunteers(query);
                return ctx.json(results);
            },
        },

        "/api/volunteers/:id/records": {
            async GET(req: any) {
                const { id } = req.params;

                if (!ctx.isValidStudentId(id)) {
                    return ctx.json({ error: "Volunteer ID must follow 620XXXXXX format" }, 400);
                }

                const result = await ctx.volunteerService.getVolunteerRecords(id);
                if (!result) return ctx.json({ error: "Volunteer not found" }, 404);
                return ctx.json(result);
            },
        },

        "/api/volunteers/:id/records/:recordId": {
            async PUT(req: any) {
                const denied = await ctx.requireAdmin(req);
                if (denied) return denied;

                const { id, recordId } = req.params;

                if (!ctx.isValidStudentId(id)) {
                    return ctx.json({ error: "Volunteer ID must follow 620XXXXXX format" }, 400);
                }

                const body = await req.json() as { hoursWorked?: number };

                if (typeof body.hoursWorked !== "number" || body.hoursWorked < 0) {
                    return ctx.json({ error: "Invalid hoursWorked value" }, 400);
                }

                try {
                    const record = await ctx.volunteerService.updateRecord(id, Number(recordId), body.hoursWorked);
                    if (!record) return ctx.json({ error: "Record not found" }, 404);
                    return ctx.json(record);
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
        },
    };
}
