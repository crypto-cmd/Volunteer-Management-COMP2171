import { type EventRequestStatus } from "@models";
import type { RouteContext, RouteMap } from "./types";

export function createEventRequestRoutes(ctx: RouteContext): RouteMap {
    return {
        "/api/events/:id/requests": {
            async POST(req: any) {
                const { id: eventId } = req.params;
                const body = await req.json() as { volunteerId?: string };
                const volunteerId = body.volunteerId?.trim() || "";

                if (!volunteerId) {
                    return ctx.json({ error: "volunteerId is required" }, 400);
                }

                if (!ctx.isValidStudentId(volunteerId)) {
                    return ctx.json({ error: "volunteerId must follow 620XXXXXX format" }, 400);
                }

                try {
                    const created = await ctx.eventRequestService.createEventRequest(volunteerId, eventId);
                    return ctx.json(created, 201);
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
        },

        "/api/event-requests": {
            async GET(req: Request) {
                const url = new URL(req.url);
                const status = url.searchParams.get("status") as EventRequestStatus | null;
                const eventId = url.searchParams.get("eventId") || undefined;
                const volunteerId = url.searchParams.get("volunteerId") || undefined;

                if (status && !["Pending", "Accepted", "Declined"].includes(status)) {
                    return ctx.json({ error: "Invalid status" }, 400);
                }

                if (volunteerId && !ctx.isValidStudentId(volunteerId)) {
                    return ctx.json({ error: "volunteerId must follow 620XXXXXX format" }, 400);
                }

                return ctx.json(await ctx.eventRequestService.getEventRequests({
                    eventId,
                    volunteerId,
                    status: status || undefined,
                }));
            },
        },

        "/api/event-requests/:requestId": {
            async PUT(req: any) {
                const denied = await ctx.requireAdmin(req);
                if (denied) return denied;

                const { requestId } = req.params;
                const body = await req.json() as { status?: EventRequestStatus };

                if (!body.status || !["Pending", "Accepted", "Declined"].includes(body.status)) {
                    return ctx.json({ error: "Invalid status" }, 400);
                }

                try {
                    const updated = await ctx.eventRequestService.updateEventRequestStatus(Number(requestId), body.status);
                    if (!updated) return ctx.json({ error: "Request not found" }, 404);

                    return ctx.json(updated);
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
        },
    };
}
