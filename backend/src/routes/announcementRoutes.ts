import type { RouteContext, RouteMap } from "./types";

export function createAnnouncementRoutes(ctx: RouteContext): RouteMap {
    return {
        "/api/announcements": {
            async GET() {
                return ctx.json(await ctx.announcementService.getAnnouncements());
            },
            async POST(req: Request) {
                const denied = await ctx.requireAdmin(req);
                if (denied) return denied;

                const studentId = req.headers.get("x-student-id")?.trim() || "";
                const body = await req.json() as { title?: string; message?: string };

                if (!body.title || !body.message) {
                    return ctx.json({ error: "title and message are required" }, 400);
                }

                try {
                    const created = await ctx.announcementService.createAnnouncement(
                        body.title.trim(),
                        body.message.trim(),
                        studentId,
                    );

                    return ctx.json(created, 201);
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
        },
    };
}
