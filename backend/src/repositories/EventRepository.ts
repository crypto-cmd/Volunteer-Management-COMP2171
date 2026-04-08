import { SupabaseClient } from "@supabase/supabase-js";
import { Event } from "@models";

export class EventRepository {
    private supabase: SupabaseClient;

    // Inject the Supabase client instead of a file path
    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient;
    }

    async findAll(): Promise<Event[]> {
        const { data, error } = await this.supabase
            .from('events')
            .select('*');

        if (error) {
            throw new Error(`Failed to fetch events: ${error.message}`);
        }

        // Map Supabase rows (event_date) to your Event model (date)
        return data.map((e) =>
            new Event(
                e.id,
                e.name,
                e.description,
                e.event_date,
                e.event_time,
                e.location,
                e.capacity,
                e.category,
                e.status,
            )
        );
    }

    async findById(eventId: string): Promise<Event | null> {
        const { data, error } = await this.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single(); // .single() returns one object instead of an array

        if (error) {
            // Supabase returns PGRST116 if no rows are found with .single()
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch event: ${error.message}`);
        }

        return new Event(
            data.id,
            data.name,
            data.description,
            data.event_date,
            data.event_time,
            data.location,
            data.capacity,
            data.category,
            data.status,
        );
    }

    async create(
        name: string,
        description: string,
        date: string,
        time: string,
        location: string,
        capacity: number,
        category: string,
        status: string,
    ): Promise<Event> {
        const { data, error } = await this.supabase
            .from('events')
            .insert({
                name,
                description,
                event_date: date,
                event_time: time,
                location,
                capacity,
                category,
                status,
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') { // Postgres unique violation code
                throw new Error("Event already exists");
            }
            throw new Error(`Failed to create event: ${error.message}`);
        }

        return new Event(
            data.id,
            data.name,
            data.description,
            data.event_date,
            data.event_time,
            data.location,
            data.capacity,
            data.category,
            data.status,
        );
    }

    async update(event: Event): Promise<void> {
        const eventData = event.toJSON();

        const { error, count } = await this.supabase
            .from('events')
            .update({
                name: eventData.name,
                description: eventData.description,
                event_date: eventData.date,
                event_time: eventData.time,
                location: eventData.location,
                capacity: eventData.capacity,
                category: eventData.category,
                status: eventData.status
            })
            .eq('id', eventData.id);

        if (error) {
            throw new Error(`Failed to update event: ${error.message}`);
        }
    }

    async delete(eventId: string): Promise<void> {
        const { error } = await this.supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (error) {
            throw new Error(`Failed to delete event: ${error.message}`);
        }
    }
}