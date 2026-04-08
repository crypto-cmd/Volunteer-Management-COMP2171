import type { RouteContext, RouteMap } from "./types";

export function createBadgeRoutes(ctx: RouteContext): RouteMap {
    return {
        "/api/badges": {
            async GET() {
                return ctx.json(await ctx.badgeService.getBadges());
            },
            async POST(req: Request) {
                const denied = await ctx.requireAdmin(req);
                if (denied) return denied;

                const body = await req.json() as { name?: string; description?: string; icon?: string };

                if (!body.name || !body.description) {
                    return ctx.json({ error: "name and description are required" }, 400);
                }

                try {
                    const created = await ctx.badgeService.createBadge(
                        body.name.trim(),
                        body.description.trim(),
                        body.icon?.trim() || "🏅",
                    );
                    return ctx.json(created, 201);
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
        },

        "/api/volunteers/:id/badges": {
            async GET(req: any) {
                const { id } = req.params;
                if (!ctx.isValidStudentId(id)) {
                    return ctx.json({ error: "Volunteer ID must follow 620XXXXXX format" }, 400);
                }

                try {
                    return ctx.json(await ctx.badgeService.getVolunteerBadges(id));
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
            async POST(req: any) {
                const denied = await ctx.requireAdmin(req);
                if (denied) return denied;

                const { id } = req.params;
                if (!ctx.isValidStudentId(id)) {
                    return ctx.json({ error: "Volunteer ID must follow 620XXXXXX format" }, 400);
                }

                const body = await req.json() as { badgeId?: number };
                if (typeof body.badgeId !== "number") {
                    return ctx.json({ error: "badgeId is required" }, 400);
                }

                try {
                    const created = await ctx.badgeService.assignBadge(id, body.badgeId);
                    return ctx.json(created, 201);
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
        },
    };
}
