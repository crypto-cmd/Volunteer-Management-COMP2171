import { SupabaseClient } from "@supabase/supabase-js";
import { Announcement } from "@models";

export class AnnouncementRepository {
    private supabase: SupabaseClient;

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient;
    }

    async getAnnouncements(): Promise<Announcement[]> {
        const { data, error } = await this.supabase
            .from("announcements")
            .select("*")
            .order("posted_at", { ascending: false });

        if (error) throw new Error(`Failed to fetch announcements: ${error.message}`);

        return data.map((a) => new Announcement(
            a.id,
            a.title,
            a.message,
            a.posted_at,
            a.posted_by
        ));
    }

    async createAnnouncement(title: string, message: string, postedBy: string): Promise<Announcement> {
        const { data, error } = await this.supabase
            .from("announcements")
            .insert({
                title,
                message,
                posted_by: postedBy,
            })
            .select("*")
            .single();

        if (error) throw new Error(`Failed to create announcement: ${error.message}`);

        return new Announcement(
            data.id,
            data.title,
            data.message,
            data.posted_at,
            data.posted_by
        );
    }
}
