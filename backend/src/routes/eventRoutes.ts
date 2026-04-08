import { Event } from "@models";
import type { RouteContext, RouteMap } from "./types";

export function createEventRoutes(ctx: RouteContext): RouteMap {
    return {
        "/api/events": {
            async GET() {
                return ctx.json(await ctx.eventService.getAllEvents());
            },
            async POST(req: Request) {
                const denied = await ctx.requireAdmin(req);
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
                    return ctx.json({ error: "Invalid event payload" }, 400);
                }

                try {
                    const created = await ctx.eventService.createEvent(
                        body.name,
                        body.description,
                        body.date,
                        body.time,
                        body.location,
                        body.capacity,
                        body.category,
                        body.status,
                    );
                    return ctx.json(created, 201);
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
        },

        "/api/events/:id": {
            async GET(req: any) {
                const event = await ctx.eventService.getEvent(req.params.id);
                if (!event) return ctx.json({ error: "Event not found" }, 404);
                return ctx.json(event);
            },
            async PUT(req: any) {
                const denied = await ctx.requireAdmin(req);
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

                const existing = await ctx.eventService.getEvent(id);
                if (!existing) return ctx.json({ error: "Event not found" }, 404);

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
                    await ctx.eventService.updateEvent(updated);
                    return ctx.json(updated);
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
            async DELETE(req: any) {
                const denied = await ctx.requireAdmin(req);
                if (denied) return denied;

                try {
                    await ctx.eventService.deleteEvent(req.params.id);
                    return ctx.json({ success: true });
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
        },
    };
}
