import { createAnnouncementRoutes } from "./announcementRoutes";
import { createAuthRoutes } from "./authRoutes";
import { createBadgeRoutes } from "./badgeRoutes";
import { createEventRequestRoutes } from "./eventRequestRoutes";
import { createEventRoutes } from "./eventRoutes";
import type { RouteContext, RouteMap } from "./types";
import { createVolunteerRoutes } from "./volunteerRoutes";

export function buildRoutes(ctx: RouteContext): RouteMap {
    return {
        "/": () => new Response("Volunteer Management API"),
        ...createAuthRoutes(ctx),
        ...createVolunteerRoutes(ctx),
        ...createEventRoutes(ctx),
        ...createEventRequestRoutes(ctx),
        ...createAnnouncementRoutes(ctx),
        ...createBadgeRoutes(ctx),
    };
}
