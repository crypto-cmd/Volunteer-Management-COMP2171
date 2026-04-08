import { SupabaseClient } from "@supabase/supabase-js";
import { EventRequest, type EventRequestStatus, UserProfile, Volunteer, TimesheetRecord } from "@models";

type ProfileUpdates = {
    name?: string;
    email?: string;
    phone?: string;
    major?: string;
    yearOfStudy?: string;
};

type RegisterPayload = {
    studentId: string;
    name: string;
    password: string;
    email?: string;
    phone?: string;
    major?: string;
    yearOfStudy?: string;
    role?: "admin" | "volunteer";
};

function mapRole(role: string | null | undefined): "Admin" | "Volunteer" {
    return role === "admin" ? "Admin" : "Volunteer";
}

function relationName(relation: { name: string } | { name: string }[] | null | undefined): string | undefined {
    if (!relation) return undefined;
    if (Array.isArray(relation)) return relation[0]?.name;
    return relation.name;
}

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

    async findByStudentIdAndPassword(studentId: string, password: string): Promise<UserProfile | null> {
        const { data, error } = await this.supabase
            .from('volunteers')
            .select('id, name, role, email, phone, major, year_of_study')
            .eq('id', studentId)
            .eq('password', password)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to authenticate user: ${error.message}`);
        }

        return new UserProfile(
            data.id,
            data.name || "",
            mapRole(data.role),
            data.email || "",
            data.phone || "",
            data.major || "",
            data.year_of_study || ""
        );
    }

    async getVolunteerProfile(studentId: string): Promise<UserProfile | null> {
        const { data, error } = await this.supabase
            .from('volunteers')
            .select('id, name, role, email, phone, major, year_of_study')
            .eq('id', studentId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch profile: ${error.message}`);
        }

        return new UserProfile(
            data.id,
            data.name || "",
            mapRole(data.role),
            data.email || "",
            data.phone || "",
            data.major || "",
            data.year_of_study || ""
        );
    }

    async updateVolunteerProfile(studentId: string, updates: ProfileUpdates): Promise<UserProfile | null> {
        const payload = {
            ...(updates.name !== undefined ? { name: updates.name } : {}),
            ...(updates.email !== undefined ? { email: updates.email } : {}),
            ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
            ...(updates.major !== undefined ? { major: updates.major } : {}),
            ...(updates.yearOfStudy !== undefined ? { year_of_study: updates.yearOfStudy } : {}),
        };

        const { data, error } = await this.supabase
            .from('volunteers')
            .update(payload)
            .eq('id', studentId)
            .select('id, name, role, email, phone, major, year_of_study')
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to update profile: ${error.message}`);
        }

        return new UserProfile(
            data.id,
            data.name || "",
            mapRole(data.role),
            data.email || "",
            data.phone || "",
            data.major || "",
            data.year_of_study || ""
        );
    }

    async createVolunteerAccount(payload: RegisterPayload): Promise<UserProfile> {
        const { data, error } = await this.supabase
            .from('volunteers')
            .insert({
                id: payload.studentId,
                name: payload.name,
                password: payload.password,
                role: payload.role || 'volunteer',
                email: payload.email || null,
                phone: payload.phone || null,
                major: payload.major || null,
                year_of_study: payload.yearOfStudy || null,
            })
            .select('id, name, role, email, phone, major, year_of_study')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Account already exists for this student ID');
            }
            throw new Error(`Failed to create account: ${error.message}`);
        }

        return new UserProfile(
            data.id,
            data.name || "",
            mapRole(data.role),
            data.email || "",
            data.phone || "",
            data.major || "",
            data.year_of_study || ""
        );
    }

    async isAdmin(studentId: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('volunteers')
            .select('role')
            .eq('id', studentId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return false;
            throw new Error(`Failed to verify admin role: ${error.message}`);
        }

        return data.role === 'admin';
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
            relationName(r.events),
            relationName(r.volunteers)
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

        const event = Array.isArray(req.events) ? req.events[0] : req.events;
        if (!event) throw new Error("Event not found for request");
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
            relationName(event),
            relationName(req.volunteers)
        );
    }
}