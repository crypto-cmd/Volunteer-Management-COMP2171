import { SupabaseClient } from "@supabase/supabase-js";
import { EventRequest, type EventRequestStatus } from "@models";

function relationName(relation: { name: string } | { name: string }[] | null | undefined): string | undefined {
    if (!relation) return undefined;
    if (Array.isArray(relation)) return relation[0]?.name;
    return relation.name;
}

export class EventRequestRepository {
    private supabase: SupabaseClient;

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient;
    }

    async getEventRequests(filters?: {
        eventId?: string;
        volunteerId?: string;
        status?: EventRequestStatus;
    }): Promise<EventRequest[]> {
        let query = this.supabase
            .from("event_requests")
            .select(`
                id,
                event_id,
                volunteer_id,
                status,
                requested_at,
                events (name),
                volunteers (name)
            `);

        if (filters?.eventId) query = query.eq("event_id", filters.eventId);
        if (filters?.volunteerId) query = query.eq("volunteer_id", filters.volunteerId);
        if (filters?.status) query = query.eq("status", filters.status);

        const { data, error } = await query;

        if (error) throw new Error(`Failed to fetch requests: ${error.message}`);

        return data.map((r) => new EventRequest(
            r.id,
            r.event_id,
            r.volunteer_id,
            r.status as EventRequestStatus,
            r.requested_at,
            relationName(r.events),
            relationName(r.volunteers)
        ));
    }

    async createEventRequest(volunteerId: string, eventId: string): Promise<EventRequest> {
        const { data: event, error: eventError } = await this.supabase
            .from("events")
            .select("name, status")
            .eq("id", eventId)
            .single();

        if (eventError || !event) throw new Error("Event not found");
        if (event.status !== "Published" && event.status !== "Ongoing") {
            throw new Error("Only published or ongoing events can accept requests");
        }

        const { data: volunteer, error: volError } = await this.supabase
            .from("volunteers")
            .select("name")
            .eq("id", volunteerId)
            .single();

        if (volError || !volunteer) throw new Error("Volunteer not found");

        const { data: existing } = await this.supabase
            .from("event_requests")
            .select("id")
            .eq("event_id", eventId)
            .eq("volunteer_id", volunteerId)
            .in("status", ["Pending", "Accepted"])
            .maybeSingle();

        if (existing) throw new Error("A request already exists for this event");

        const { data: newRequest, error: insertError } = await this.supabase
            .from("event_requests")
            .insert({
                event_id: eventId,
                volunteer_id: volunteerId,
                status: "Pending",
            })
            .select()
            .single();

        if (insertError) throw new Error(`Failed to create request: ${insertError.message}`);

        return new EventRequest(
            newRequest.id,
            newRequest.event_id,
            newRequest.volunteer_id,
            newRequest.status,
            newRequest.requested_at,
            event.name,
            volunteer.name
        );
    }

    async updateEventRequestStatus(requestId: number, status: EventRequestStatus): Promise<EventRequest | null> {
        const { data: req, error: reqError } = await this.supabase
            .from("event_requests")
            .select("*, events(id, name, event_date, capacity), volunteers(name)")
            .eq("id", requestId)
            .single();

        if (reqError) {
            if (reqError.code === "PGRST116") return null;
            throw new Error(`Request not found: ${reqError.message}`);
        }

        const event = Array.isArray(req.events) ? req.events[0] : req.events;
        if (!event) throw new Error("Event not found for request");
        const wasAccepted = req.status === "Accepted";

        if (status === "Accepted" && !wasAccepted) {
            const { count, error: countError } = await this.supabase
                .from("event_requests")
                .select("id", { count: "exact", head: true })
                .eq("event_id", event.id)
                .eq("status", "Accepted");

            if (countError) throw new Error(`Failed to check capacity: ${countError.message}`);

            if ((count || 0) >= event.capacity) {
                throw new Error("Event is at capacity. Please update event capacity before accepting more volunteers.");
            }
        }

        const { error: updateError } = await this.supabase
            .from("event_requests")
            .update({ status })
            .eq("id", requestId);

        if (updateError) throw new Error(`Failed to update status: ${updateError.message}`);

        if (status === "Accepted" && !wasAccepted) {
            const { error: tsError } = await this.supabase
                .from("timesheet_records")
                .upsert({
                    volunteer_id: req.volunteer_id,
                    event_id: event.id,
                    record_date: event.event_date,
                    event_name: event.name,
                    hours_worked: 0,
                }, { onConflict: "volunteer_id, event_id" });

            if (tsError) throw new Error(`Failed to initialize timesheet: ${tsError.message}`);
        }

        return new EventRequest(
            req.id,
            req.event_id,
            req.volunteer_id,
            status,
            req.requested_at,
            relationName(event),
            relationName(req.volunteers)
        );
    }
}
