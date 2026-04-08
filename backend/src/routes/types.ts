import {
    AnnouncementService,
    BadgeService,
    EventRequestService,
    ManageEventsService,
    VolunteerService,
} from "@services";

export type RouteContext = {
    volunteerService: VolunteerService;
    eventService: ManageEventsService;
    eventRequestService: EventRequestService;
    announcementService: AnnouncementService;
    badgeService: BadgeService;
    isValidStudentId: (value: string) => boolean;
    json: (body: unknown, status?: number) => Response;
    requireAdmin: (req: Request) => Promise<Response | null>;
};

export type RouteMap = Record<string, any>;
