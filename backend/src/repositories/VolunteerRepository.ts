import { SupabaseClient } from "@supabase/supabase-js";
import { EventRequest, type EventRequestStatus, Volunteer, TimesheetRecord } from "@models";

export class VolunteerRepository {
    private supabase: SupabaseClient;

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient;
    }

    async findAllVolunteers(): Promise<Volunteer[]> {
        const { data, error } = await this.supabase
            .from('volunteers')
            .select('*');

        if (error) throw new Error(`Failed to fetch volunteers: ${error.message}`);

        return data.map(v => new Volunteer(v.id, v.name));
    }

    async findVolunteerById(id: string): Promise<Volunteer | null> {
        const { data, error } = await this.supabase
            .from('volunteers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw new Error(`Failed to fetch volunteer: ${error.message}`);
        }

        return new Volunteer(data.id, data.name);
    }

    async getRecordsForVolunteer(volunteerId: string): Promise<TimesheetRecord[]> {
        const { data, error } = await this.supabase
            .from('timesheet_records')
            .select('*')
            .eq('volunteer_id', volunteerId);

        if (error) throw new Error(`Failed to fetch timesheet records: ${error.message}`);

        return data.map(r => new TimesheetRecord(
            r.id,
            r.record_date, // Mapped to DB column
            r.event_id || "",
            r.event_name || "Unknown Event",
            r.hours_worked // Mapped to DB column
        ));
    }

    async updateRecord(volunteerId: string, recordId: number, hoursWorked: number): Promise<TimesheetRecord | null> {
        // We use .select() at the end to return the updated row immediately
        const { data, error } = await this.supabase
            .from('timesheet_records')
            .update({ hours_worked: hoursWorked })
            .eq('id', recordId)
            .eq('volunteer_id', volunteerId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to update record: ${error.message}`);
        }

        return new TimesheetRecord(
            data.id,
            data.record_date,
            data.event_id || "",
            data.event_name || "Unknown Event",
            data.hours_worked
        );
    }

    async getEventRequests(filters?: {
        eventId?: string;
        volunteerId?: string;
        status?: EventRequestStatus;
    }): Promise<EventRequest[]> {


        // This query automatically joins the events and volunteers tables
        // to grab the names, replacing the manual Maps in your old code.
        let query = this.supabase
            .from('event_requests')
            .select(`
                id,
                event_id,
                volunteer_id,
                status,
                requested_at,
                events (name),
                volunteers (name)
            `);

        if (filters?.eventId) query = query.eq('event_id', filters.eventId);
        if (filters?.volunteerId) query = query.eq('volunteer_id', filters.volunteerId);
        if (filters?.status) query = query.eq('status', filters.status);

        const { data, error } = await query;

        if (error) throw new Error(`Failed to fetch requests: ${error.message}`);

        return data.map(r => new EventRequest(
            r.id,
            r.event_id,
            r.volunteer_id,
            r.status as EventRequestStatus,
            r.requested_at,
            r.events?.name,      // Extracted from the join
            r.volunteers?.name   // Extracted from the join
        ));
    }

    async createEventRequest(volunteerId: string, eventId: string): Promise<EventRequest> {
        // 1. Fetch event to validate status
        const { data: event, error: eventError } = await this.supabase
            .from('events')
            .select('name, status')
            .eq('id', eventId)
            .single();

        if (eventError || !event) throw new Error("Event not found");
        if (event.status !== "Published" && event.status !== "Ongoing") {
            throw new Error("Only published or ongoing events can accept requests");
        }

        // 2. Fetch volunteer to ensure they exist and get name
        const { data: volunteer, error: volError } = await this.supabase
            .from('volunteers')
            .select('name')
            .eq('id', volunteerId)
            .single();

        if (volError || !volunteer) throw new Error("Volunteer not found");

        // 3. Check for existing active requests
        const { data: existing } = await this.supabase
            .from('event_requests')
            .select('id')
            .eq('event_id', eventId)
            .eq('volunteer_id', volunteerId)
            .in('status', ['Pending', 'Accepted'])
            .maybeSingle();

        if (existing) throw new Error("A request already exists for this event");

        // 4. Insert the new request
        const { data: newRequest, error: insertError } = await this.supabase
            .from('event_requests')
            .insert({
                event_id: eventId,
                volunteer_id: volunteerId,
                status: 'Pending'
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
        // 1. Get current request details
        const { data: req, error: reqError } = await this.supabase
            .from('event_requests')
            .select('*, events(id, name, event_date, capacity), volunteers(name)')
            .eq('id', requestId)
            .single();

        if (reqError) {
            if (reqError.code === 'PGRST116') return null;
            throw new Error(`Request not found: ${reqError.message}`);
        }

        const event = req.events;
        const wasAccepted = req.status === 'Accepted';

        // 2. Capacity Check if accepting
        if (status === "Accepted" && !wasAccepted) {
            const { count, error: countError } = await this.supabase
                .from('event_requests')
                .select('id', { count: 'exact', head: true })
                .eq('event_id', event.id)
                .eq('status', 'Accepted');

            if (countError) throw new Error(`Failed to check capacity: ${countError.message}`);

            if ((count || 0) >= event.capacity) {
                throw new Error("Event is at capacity. Please update event capacity before accepting more volunteers.");
            }
        }

        // 3. Update the request status
        const { error: updateError } = await this.supabase
            .from('event_requests')
            .update({ status })
            .eq('id', requestId);

        if (updateError) throw new Error(`Failed to update status: ${updateError.message}`);

        // 4. If newly accepted, initialize a timesheet record
        if (status === "Accepted" && !wasAccepted) {
            // Using upsert with 'onConflict' ensures we don't duplicate records 
            // if one somehow already exists, bypassing the need to check first.
            const { error: tsError } = await this.supabase
                .from('timesheet_records')
                .upsert({
                    volunteer_id: req.volunteer_id,
                    event_id: event.id,
                    record_date: event.event_date,
                    event_name: event.name,
                    hours_worked: 0
                }, { onConflict: 'volunteer_id, event_id' });

            if (tsError) throw new Error(`Failed to initialize timesheet: ${tsError.message}`);
        }

        return new EventRequest(
            req.id,
            req.event_id,
            req.volunteer_id,
            status,
            req.requested_at,
            event.name,
            req.volunteers.name
        );
    }
}